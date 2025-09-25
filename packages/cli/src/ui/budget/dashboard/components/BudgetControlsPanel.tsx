/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { theme } from '../../../semantic-colors.js';
import { formatTime } from '../utils/chartUtils.js';
import type { DashboardFilters } from '../types/index.js';

/**
 * Props for the BudgetControlsPanel component.
 */
interface BudgetControlsPanelProps {
  /** Current dashboard filters */
  filters: DashboardFilters;
  /** Callback when filters are updated */
  onUpdateFilters?: (filters: Partial<DashboardFilters>) => void;
  /** Whether auto-refresh is enabled */
  autoRefresh: boolean;
  /** Callback to toggle auto-refresh */
  onToggleAutoRefresh?: () => void;
  /** Current refresh interval in seconds */
  refreshInterval: number;
  /** Callback to export dashboard data */
  onExportData?: (format: 'json' | 'csv') => Promise<string>;
}

/**
 * Budget Controls Panel Component
 *
 * This component provides dashboard configuration and control options
 * in a CLI-optimized interface. It allows users to modify filters,
 * configure settings, manage exports, and control dashboard behavior.
 *
 * Features:
 * - Time range filter configuration
 * - Feature inclusion/exclusion filters
 * - Cost and usage range filters
 * - Auto-refresh toggle and interval settings
 * - Data export controls (JSON, CSV)
 * - Filter presets (today, week, month, etc.)
 * - Keyboard navigation for all settings
 *
 * @param props - Configuration and callbacks for the controls panel
 * @returns Interactive budget controls panel component
 */
export const BudgetControlsPanel: React.FC<BudgetControlsPanelProps> = ({
  filters,
  onUpdateFilters,
  autoRefresh,
  onToggleAutoRefresh,
  refreshInterval,
  onExportData,
}) => {
  const [selectedSection, setSelectedSection] = useState(0);
  const [selectedOption, setSelectedOption] = useState(0);

  // Available control sections
  const sections = [
    'Time Range',
    'Features',
    'Cost Range',
    'Refresh Settings',
    'Export Data',
  ];

  // Time range presets
  const timeRangePresets = [
    { label: 'Today', value: 'today' as const },
    { label: 'Yesterday', value: 'yesterday' as const },
    { label: 'This Week', value: 'week' as const },
    { label: 'This Month', value: 'month' as const },
    { label: 'This Quarter', value: 'quarter' as const },
    { label: 'This Year', value: 'year' as const },
    { label: 'Custom Range', value: 'custom' as const },
  ];

  // Available features for filtering
  const availableFeatures = [
    'chat',
    'code-analysis',
    'completion',
    'debugging',
    'refactoring',
    'documentation',
  ];

  // Handle keyboard navigation
  useInput((input, key) => {
    if (key.leftArrow || input === 'h') {
      setSelectedSection(Math.max(0, selectedSection - 1));
      setSelectedOption(0);
    } else if (key.rightArrow || input === 'l') {
      setSelectedSection(Math.min(sections.length - 1, selectedSection + 1));
      setSelectedOption(0);
    } else if (key.upArrow || input === 'k') {
      setSelectedOption(Math.max(0, selectedOption - 1));
    } else if (key.downArrow || input === 'j') {
      const maxOptions = getMaxOptionsForSection(selectedSection);
      setSelectedOption(Math.min(maxOptions - 1, selectedOption + 1));
    } else if (key.return || input === ' ') {
      handleSelection();
    } else if (input === 't') {
      // Quick toggle auto-refresh
      onToggleAutoRefresh?.();
    } else if (input === 'e') {
      // Quick export JSON
      onExportData?.('json').then((data) => {
        console.log('Export completed:', data.length, 'characters');
      });
    } else if (input === 'c') {
      // Quick export CSV
      onExportData?.('csv').then((data) => {
        console.log('Export completed:', data.length, 'characters');
      });
    }
  });

  /**
   * Gets the maximum number of options for a given section.
   */
  const getMaxOptionsForSection = (sectionIndex: number): number => {
    switch (sectionIndex) {
      case 0: // Time Range
        return timeRangePresets.length;
      case 1: // Features
        return availableFeatures.length;
      case 2: // Cost Range
        return 3; // Min, Max, Reset
      case 3: // Refresh Settings
        return 2; // Toggle, Interval
      case 4: // Export Data
        return 2; // JSON, CSV
      default:
        return 1;
    }
  };

  /**
   * Handles selection based on current section and option.
   */
  const handleSelection = () => {
    switch (selectedSection) {
      case 0: // Time Range
        handleTimeRangeSelection();
        break;
      case 1: // Features
        handleFeatureSelection();
        break;
      case 2: // Cost Range
        handleCostRangeSelection();
        break;
      case 3: // Refresh Settings
        handleRefreshSettingsSelection();
        break;
      case 4: // Export Data
        handleExportSelection();
        break;
      default:
        // Do nothing for unknown sections
        break;
    }
  };

  /**
   * Handles time range preset selection.
   */
  const handleTimeRangeSelection = () => {
    const preset = timeRangePresets[selectedOption];
    if (!preset || !onUpdateFilters) return;

    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (preset.value) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        start = new Date(
          now.getFullYear(),
          Math.floor(now.getMonth() / 3) * 3,
          1,
        );
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return; // Custom range requires different handling
    }

    onUpdateFilters({
      timeRange: {
        start,
        end,
        preset: preset.value,
      },
    });
  };

  /**
   * Handles feature inclusion/exclusion selection.
   */
  const handleFeatureSelection = () => {
    if (!onUpdateFilters) return;

    const feature = availableFeatures[selectedOption];
    const isIncluded = filters.features.include.includes(feature);
    const isExcluded = filters.features.exclude.includes(feature);

    let newInclude = [...filters.features.include];
    let newExclude = [...filters.features.exclude];

    if (isIncluded) {
      // Move from include to exclude
      newInclude = newInclude.filter((f) => f !== feature);
      newExclude.push(feature);
    } else if (isExcluded) {
      // Remove from exclude (neutral)
      newExclude = newExclude.filter((f) => f !== feature);
    } else {
      // Add to include
      newInclude.push(feature);
    }

    onUpdateFilters({
      features: {
        include: newInclude,
        exclude: newExclude,
      },
    });
  };

  /**
   * Handles cost range configuration.
   */
  const handleCostRangeSelection = () => {
    if (!onUpdateFilters) return;

    switch (selectedOption) {
      case 0: // Set Min
        // For CLI, we'll use preset values
        onUpdateFilters({
          costRange: {
            min: 0.01,
            max: filters.costRange?.max || 100,
          },
        });
        break;
      case 1: // Set Max
        onUpdateFilters({
          costRange: {
            min: filters.costRange?.min || 0,
            max: 50,
          },
        });
        break;
      case 2: // Reset
        onUpdateFilters({
          costRange: undefined,
        });
        break;
      default:
        // Do nothing for unknown options
        break;
    }
  };

  /**
   * Handles refresh settings selection.
   */
  const handleRefreshSettingsSelection = () => {
    switch (selectedOption) {
      case 0: // Toggle auto-refresh
        onToggleAutoRefresh?.();
        break;
      case 1: // Change interval (cycle through common intervals)
        // This would ideally be a more interactive control
        break;
      default:
        // Do nothing for unknown options
        break;
    }
  };

  /**
   * Handles data export selection.
   */
  const handleExportSelection = () => {
    if (!onExportData) return;

    const format = selectedOption === 0 ? 'json' : 'csv';
    onExportData(format).then((data) => {
      console.log(
        `${format.toUpperCase()} export completed:`,
        data.length,
        'characters',
      );
    });
  };

  /**
   * Renders the controls header.
   */
  const renderHeader = () => (
    <Box flexDirection="column" marginBottom={2}>
      <Text color={theme.text.primary} bold marginBottom={1}>
        Dashboard Settings & Controls
      </Text>
      <Text color={theme.text.secondary}>
        Configure filters, export options, and dashboard behavior
      </Text>
    </Box>
  );

  /**
   * Renders the section navigation.
   */
  const renderSectionNavigation = () => (
    <Box gap={2} marginBottom={2}>
      {sections.map((section, index) => (
        <Text
          key={section}
          color={
            index === selectedSection
              ? theme.primary.main
              : theme.text.secondary
          }
          backgroundColor={
            index === selectedSection ? theme.primary.light : undefined
          }
          bold={index === selectedSection}
        >
          {section}
        </Text>
      ))}
    </Box>
  );

  /**
   * Renders the time range controls section.
   */
  const renderTimeRangeControls = () => (
    <Box flexDirection="column">
      <Text color={theme.text.muted} marginBottom={1}>
        Current: {formatTime(filters.timeRange.start)} to{' '}
        {formatTime(filters.timeRange.end)}
        {filters.timeRange.preset && ` (${filters.timeRange.preset})`}
      </Text>

      <Text color={theme.text.muted} marginBottom={1}>
        Select preset:
      </Text>

      {timeRangePresets.map((preset, index) => (
        <Box key={preset.value} alignItems="center" gap={1} marginBottom={1}>
          <Text
            color={
              index === selectedOption && selectedSection === 0
                ? theme.primary.main
                : filters.timeRange.preset === preset.value
                  ? theme.status.success
                  : theme.text.secondary
            }
          >
            {index === selectedOption && selectedSection === 0 ? '→' : ' '}
            {preset.label}
          </Text>
          {filters.timeRange.preset === preset.value && (
            <Text color={theme.status.success}>✓</Text>
          )}
        </Box>
      ))}
    </Box>
  );

  /**
   * Renders the feature controls section.
   */
  const renderFeatureControls = () => (
    <Box flexDirection="column">
      <Text color={theme.text.muted} marginBottom={1}>
        Feature Filters:
      </Text>

      {availableFeatures.map((feature, index) => {
        const isIncluded = filters.features.include.includes(feature);
        const isExcluded = filters.features.exclude.includes(feature);
        const status = isIncluded
          ? 'included'
          : isExcluded
            ? 'excluded'
            : 'neutral';

        const statusColor =
          status === 'included'
            ? theme.status.success
            : status === 'excluded'
              ? theme.status.error
              : theme.text.secondary;

        const statusIcon =
          status === 'included' ? '✓' : status === 'excluded' ? '✗' : '○';

        return (
          <Box key={feature} alignItems="center" gap={1} marginBottom={1}>
            <Text
              color={
                index === selectedOption && selectedSection === 1
                  ? theme.primary.main
                  : theme.text.secondary
              }
            >
              {index === selectedOption && selectedSection === 1 ? '→' : ' '}
              {feature}
            </Text>
            <Text color={statusColor}>{statusIcon}</Text>
            <Text color={theme.text.muted}>({status})</Text>
          </Box>
        );
      })}

      <Text color={theme.text.muted} marginTop={1}>
        Press Enter to cycle: neutral → included → excluded
      </Text>
    </Box>
  );

  /**
   * Renders the cost range controls section.
   */
  const renderCostRangeControls = () => (
    <Box flexDirection="column">
      <Text color={theme.text.muted} marginBottom={1}>
        Cost Range Filter:
      </Text>

      {filters.costRange ? (
        <Text color={theme.text.secondary} marginBottom={1}>
          Current: ${filters.costRange.min.toFixed(2)} - $
          {filters.costRange.max.toFixed(2)}
        </Text>
      ) : (
        <Text color={theme.text.muted} marginBottom={1}>
          No cost filter applied (showing all costs)
        </Text>
      )}

      <Box flexDirection="column" gap={1}>
        <Text
          color={
            selectedOption === 0 && selectedSection === 2
              ? theme.primary.main
              : theme.text.secondary
          }
        >
          {selectedOption === 0 && selectedSection === 2 ? '→' : ' '}
          Set minimum cost ($0.01)
        </Text>
        <Text
          color={
            selectedOption === 1 && selectedSection === 2
              ? theme.primary.main
              : theme.text.secondary
          }
        >
          {selectedOption === 1 && selectedSection === 2 ? '→' : ' '}
          Set maximum cost ($50.00)
        </Text>
        <Text
          color={
            selectedOption === 2 && selectedSection === 2
              ? theme.primary.main
              : theme.text.secondary
          }
        >
          {selectedOption === 2 && selectedSection === 2 ? '→' : ' '}
          Reset cost filter
        </Text>
      </Box>
    </Box>
  );

  /**
   * Renders the refresh settings controls section.
   */
  const renderRefreshControls = () => (
    <Box flexDirection="column">
      <Text color={theme.text.muted} marginBottom={1}>
        Auto-refresh Settings:
      </Text>

      <Box flexDirection="column" gap={1} marginBottom={2}>
        <Box alignItems="center" gap={2}>
          <Text
            color={
              selectedOption === 0 && selectedSection === 3
                ? theme.primary.main
                : theme.text.secondary
            }
          >
            {selectedOption === 0 && selectedSection === 3 ? '→' : ' '}
            Auto-refresh:
          </Text>
          <Text color={autoRefresh ? theme.status.success : theme.status.error}>
            {autoRefresh ? 'ON' : 'OFF'}
          </Text>
        </Box>

        <Box alignItems="center" gap={2}>
          <Text
            color={
              selectedOption === 1 && selectedSection === 3
                ? theme.primary.main
                : theme.text.secondary
            }
          >
            {selectedOption === 1 && selectedSection === 3 ? '→' : ' '}
            Interval:
          </Text>
          <Text color={theme.text.primary}>{refreshInterval}s</Text>
        </Box>
      </Box>

      <Text color={theme.text.muted}>
        Press &apos;t&apos; to quickly toggle auto-refresh
      </Text>
    </Box>
  );

  /**
   * Renders the export controls section.
   */
  const renderExportControls = () => (
    <Box flexDirection="column">
      <Text color={theme.text.muted} marginBottom={1}>
        Export Dashboard Data:
      </Text>

      <Box flexDirection="column" gap={1} marginBottom={2}>
        <Text
          color={
            selectedOption === 0 && selectedSection === 4
              ? theme.primary.main
              : theme.text.secondary
          }
        >
          {selectedOption === 0 && selectedSection === 4 ? '→' : ' '}
          Export as JSON (detailed)
        </Text>
        <Text
          color={
            selectedOption === 1 && selectedSection === 4
              ? theme.primary.main
              : theme.text.secondary
          }
        >
          {selectedOption === 1 && selectedSection === 4 ? '→' : ' '}
          Export as CSV (summary)
        </Text>
      </Box>

      <Text color={theme.text.muted} marginBottom={1}>
        Quick exports: &apos;e&apos; for JSON, &apos;c&apos; for CSV
      </Text>
    </Box>
  );

  /**
   * Renders the current section content.
   */
  const renderCurrentSection = () => {
    switch (selectedSection) {
      case 0:
        return renderTimeRangeControls();
      case 1:
        return renderFeatureControls();
      case 2:
        return renderCostRangeControls();
      case 3:
        return renderRefreshControls();
      case 4:
        return renderExportControls();
      default:
        return null;
    }
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
        <Text color={theme.text.muted}>←→/hl: Sections</Text>
        <Text color={theme.text.muted}>↑↓/jk: Options</Text>
        <Text color={theme.text.muted}>Enter: Select</Text>
        <Text color={theme.text.muted}>t: Toggle refresh</Text>
        <Text color={theme.text.muted}>e/c: Export</Text>
      </Box>
      <Text color={theme.text.muted}>
        {sections[selectedSection]} ({selectedOption + 1}/
        {getMaxOptionsForSection(selectedSection)})
      </Text>
    </Box>
  );

  // Render the complete controls panel
  return (
    <Box flexDirection="column" minHeight={25}>
      {renderHeader()}
      {renderSectionNavigation()}
      <Box flexGrow={1} paddingX={2} paddingY={1} borderStyle="single">
        {renderCurrentSection()}
      </Box>
      {renderFooter()}
    </Box>
  );
};
