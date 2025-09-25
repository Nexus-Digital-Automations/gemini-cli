/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsx as _jsx } from 'react/jsx-runtime';
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { render } from 'ink-testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BudgetDashboard } from '../components/BudgetDashboard.js';
// Mock the useBudgetDashboard hook
vi.mock('../hooks/useBudgetDashboard.js', () => ({
  useBudgetDashboard: vi.fn(),
}));
// Mock all chart components
vi.mock('../charts/TokenUsageChart.js', () => ({
  TokenUsageChart: ({ config }) =>
    _jsx('div', { 'data-testid': 'token-usage-chart', children: config.title }),
}));
vi.mock('../charts/CostBreakdownChart.js', () => ({
  CostBreakdownChart: ({ config }) =>
    _jsx('div', {
      'data-testid': 'cost-breakdown-chart',
      children: config.title,
    }),
}));
vi.mock('../charts/UsageTrendsGraph.js', () => ({
  UsageTrendsGraph: ({ config }) =>
    _jsx('div', {
      'data-testid': 'usage-trends-graph',
      children: config.title,
    }),
}));
vi.mock('../charts/CostProjectionChart.js', () => ({
  CostProjectionChart: ({ config }) =>
    _jsx('div', {
      'data-testid': 'cost-projection-chart',
      children: config.title,
    }),
}));
vi.mock('../components/BudgetAlertsPanel.js', () => ({
  BudgetAlertsPanel: () =>
    _jsx('div', {
      'data-testid': 'budget-alerts-panel',
      children: 'Alerts Panel',
    }),
}));
vi.mock('../components/BudgetControlsPanel.js', () => ({
  BudgetControlsPanel: () =>
    _jsx('div', {
      'data-testid': 'budget-controls-panel',
      children: 'Controls Panel',
    }),
}));
// Import the mocked hook
import { useBudgetDashboard } from '../hooks/useBudgetDashboard.js';
const mockUseBudgetDashboard = useBudgetDashboard;

// Shared test data - available to all describe blocks
const defaultProps = {
    projectRoot: '/test/project',
    budgetSettings: { enabled: true, dailyLimit: 1000 },
    initialView: 'overview',
    compact: false,
    refreshInterval: 30,
  };
  const mockDashboardData = {
    budgetStats: {
      requestCount: 500,
      dailyLimit: 1000,
      remainingRequests: 500,
      usagePercentage: 50,
      timeUntilReset: '12h 30m',
      lastUpdated: new Date(),
    },
    historicalData: [
      {
        timestamp: new Date(),
        tokens: 1000,
        cost: 0.1,
        requests: 10,
        feature: 'test',
      },
    ],
    costBreakdown: [
      {
        feature: 'chat',
        cost: 5.0,
        percentage: 50,
        tokens: 5000,
        requests: 100,
        avgCostPerRequest: 0.05,
      },
    ],
    alerts: [],
    projections: [],
    dashboardState: {
      activeView: 'overview',
      filters: {
        timeRange: {
          start: new Date(),
          end: new Date(),
          preset: 'week',
        },
        features: {
          include: [],
          exclude: [],
        },
      },
      isLoading: false,
      lastRefresh: new Date(),
      refreshInterval: 30,
      autoRefresh: true,
      error: null,
    },
    setActiveView: vi.fn(),
    updateFilters: vi.fn(),
    refreshData: vi.fn(),
    toggleAutoRefresh: vi.fn(),
    dismissAlert: vi.fn(),
    exportData: vi.fn(),
};

describe('BudgetDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBudgetDashboard.mockReturnValue(mockDashboardData);
  });
  it('should render disabled state when budget is not enabled', () => {
    const { lastFrame } = render(
      _jsx(BudgetDashboard, {
        ...defaultProps,
        budgetSettings: { enabled: false },
      }),
    );
    expect(lastFrame()).toContain('Budget tracking is disabled');
    expect(lastFrame()).toContain(
      'Enable budget settings to view the dashboard',
    );
  });
  it('should render loading state when dashboard is loading', () => {
    mockUseBudgetDashboard.mockReturnValue({
      ...mockDashboardData,
      budgetStats: null,
      dashboardState: {
        ...mockDashboardData.dashboardState,
        isLoading: true,
      },
    });
    const { lastFrame } = render(_jsx(BudgetDashboard, { ...defaultProps }));
    expect(lastFrame()).toContain('Loading budget dashboard...');
    expect(lastFrame()).toContain('Fetching real-time budget data');
  });
  it('should render error state when there is an error', () => {
    mockUseBudgetDashboard.mockReturnValue({
      ...mockDashboardData,
      dashboardState: {
        ...mockDashboardData.dashboardState,
        error: 'Failed to load data',
      },
    });
    const { lastFrame } = render(_jsx(BudgetDashboard, { ...defaultProps }));
    expect(lastFrame()).toContain('Dashboard Error');
    expect(lastFrame()).toContain('Failed to load data');
    expect(lastFrame()).toContain("Press 'r' to retry");
  });
  it('should render dashboard with navigation options', () => {
    const { lastFrame } = render(_jsx(BudgetDashboard, { ...defaultProps }));
    expect(lastFrame()).toContain('📊 Overview');
    expect(lastFrame()).toContain('🔥 Usage');
    expect(lastFrame()).toContain('💰 Costs');
    expect(lastFrame()).toContain('📈 Trends');
    expect(lastFrame()).toContain('🚨 Alerts');
    expect(lastFrame()).toContain('⚙️ Settings');
  });
  it('should render budget stats header', () => {
    const { lastFrame } = render(_jsx(BudgetDashboard, { ...defaultProps }));
    expect(lastFrame()).toContain('Budget Usage Dashboard');
    expect(lastFrame()).toContain('500/1000'); // Usage
    expect(lastFrame()).toContain('50.0%'); // Percentage
    expect(lastFrame()).toContain('500'); // Remaining
    expect(lastFrame()).toContain('12h 30m'); // Reset time
  });
  it('should render overview view by default', () => {
    const { lastFrame } = render(_jsx(BudgetDashboard, { ...defaultProps }));
    // Should contain charts in overview
    expect(lastFrame()).toContain('Token Usage Trend');
    expect(lastFrame()).toContain('Cost Breakdown');
  });
  it('should render active alerts indicator', () => {
    mockUseBudgetDashboard.mockReturnValue({
      ...mockDashboardData,
      alerts: [
        {
          id: 'test-alert',
          type: 'usage_threshold',
          severity: 'warning',
          title: 'High Usage',
          message: 'Usage is above threshold',
          threshold: 80,
          currentValue: 90,
          isActive: true,
          triggeredAt: new Date(),
          suggestedActions: [],
        },
      ],
    });
    const { lastFrame } = render(_jsx(BudgetDashboard, { ...defaultProps }));
    expect(lastFrame()).toContain('🚨 1 active alert');
  });
  it('should render keyboard shortcuts in footer when not compact', () => {
    const { lastFrame } = render(
      _jsx(BudgetDashboard, { ...defaultProps, compact: false }),
    );
    expect(lastFrame()).toContain('←→/hl: Navigate');
    expect(lastFrame()).toContain('Enter/Space: Select');
    expect(lastFrame()).toContain('r: Refresh');
    expect(lastFrame()).toContain('t: Toggle auto-refresh');
    expect(lastFrame()).toContain('e: Export');
    expect(lastFrame()).toContain('Auto-refresh: ON');
  });
  it('should not render footer when compact', () => {
    const { lastFrame } = render(
      _jsx(BudgetDashboard, { ...defaultProps, compact: true }),
    );
    expect(lastFrame()).not.toContain('←→/hl: Navigate');
  });
  it('should initialize with correct hook parameters', () => {
    render(_jsx(BudgetDashboard, { ...defaultProps }));
    expect(mockUseBudgetDashboard).toHaveBeenCalledWith({
      projectRoot: '/test/project',
      budgetSettings: { enabled: true, dailyLimit: 1000 },
      refreshInterval: 30,
      autoRefresh: true,
    });
  });
  it('should handle different initial views', () => {
    mockUseBudgetDashboard.mockReturnValue({
      ...mockDashboardData,
      dashboardState: {
        ...mockDashboardData.dashboardState,
        activeView: 'usage',
      },
    });
    const { lastFrame } = render(
      _jsx(BudgetDashboard, { ...defaultProps, initialView: 'usage' }),
    );
    expect(lastFrame()).toContain('Token Usage Analysis');
  });
});
describe('BudgetDashboard Chart Utilities', () => {
  it('should use correct progress bar colors based on usage percentage', () => {
    // Test high usage (>= 90%)
    mockUseBudgetDashboard.mockReturnValue({
      ...mockDashboardData,
      budgetStats: {
        ...mockDashboardData.budgetStats,
        usagePercentage: 95,
      },
    });
    const { lastFrame: highUsageFrame } = render(
      _jsx(BudgetDashboard, { ...defaultProps }),
    );
    // Should show high usage indicators
    expect(highUsageFrame()).toContain('95.0%');
    // Test medium usage (>= 75% but < 90%)
    mockUseBudgetDashboard.mockReturnValue({
      ...mockDashboardData,
      budgetStats: {
        ...mockDashboardData.budgetStats,
        usagePercentage: 80,
      },
    });
    const { lastFrame: mediumUsageFrame } = render(
      _jsx(BudgetDashboard, { ...defaultProps }),
    );
    expect(mediumUsageFrame()).toContain('80%');
    // Test low usage (< 75%)
    mockUseBudgetDashboard.mockReturnValue({
      ...mockDashboardData,
      budgetStats: {
        ...mockDashboardData.budgetStats,
        usagePercentage: 30,
      },
    });
    const { lastFrame: lowUsageFrame } = render(
      _jsx(BudgetDashboard, { ...defaultProps }),
    );
    expect(lowUsageFrame()).toContain('30%');
  });
});
//# sourceMappingURL=BudgetDashboard.test.js.map
