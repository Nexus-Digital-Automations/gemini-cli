/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import _React from 'react';
import { render, act } from '@testing-library/react';
import { BudgetDisplay } from '../BudgetDisplay.js';
import { createBudgetTracker } from '@google/gemini-cli-core';
// Mock the budget tracker
vi.mock('@google/gemini-cli-core', () => ({
    createBudgetTracker: vi.fn(() => ({
        getUsageStats: vi.fn(),
    })),
}));
// Mock the theme import
vi.mock('../semantic-colors.js', () => ({
    theme: {
        status: {
            success: 'green',
            warning: 'yellow',
            error: 'red',
        },
        text: {
            secondary: 'gray',
            muted: 'lightgray',
        },
    },
}));
const mockTracker = {
    getUsageStats: vi.fn(),
};
const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
describe('BudgetDisplay', () => {
    let defaultProps;
    let budgetSettings;
    beforeEach(() => {
        vi.clearAllMocks();
        consoleSpy.mockClear();
        budgetSettings = {
            enabled: true,
            dailyLimit: 100,
            resetTime: '00:00',
            warningThresholds: [50, 75, 90],
        };
        defaultProps = {
            budgetSettings,
            projectRoot: '/test/project',
            compact: false,
        };
        vi.mocked(createBudgetTracker).mockReturnValue(mockTracker);
        // Mock timer functions for async operations
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
        consoleSpy.mockClear();
    });
    describe('Rendering Conditions', () => {
        it('should not render when budget is disabled', async () => {
            const disabledSettings = { ...budgetSettings, enabled: false };
            mockTracker.getUsageStats.mockResolvedValue({
                requestCount: 25,
                dailyLimit: 100,
                remainingRequests: 75,
                usagePercentage: 25,
                timeUntilReset: '14h 30m',
            });
            const { container } = render(_jsx(BudgetDisplay, { ...defaultProps, budgetSettings: disabledSettings }));
            // Wait for async loading
            await act(async () => {
                vi.runAllTimers();
            });
            expect(container.firstChild).toBeNull();
        });
        it('should not render when budget settings are undefined', async () => {
            const { container } = render(_jsx(BudgetDisplay, { ...defaultProps, budgetSettings: undefined }));
            // Wait for async loading
            await act(async () => {
                vi.runAllTimers();
            });
            expect(container.firstChild).toBeNull();
        });
        it('should not render while loading', () => {
            mockTracker.getUsageStats.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));
            const { container } = render(_jsx(BudgetDisplay, { ...defaultProps }));
            expect(container.firstChild).toBeNull();
        });
        it('should not render when stats loading fails', async () => {
            mockTracker.getUsageStats.mockRejectedValue(new Error('Failed to load'));
            const { container } = render(_jsx(BudgetDisplay, { ...defaultProps }));
            await act(async () => {
                vi.runAllTimers();
            });
            expect(container.firstChild).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith('Failed to load budget stats:', expect.any(Error));
        });
    });
    describe('Full Display Mode', () => {
        beforeEach(() => {
            mockTracker.getUsageStats.mockResolvedValue({
                requestCount: 25,
                dailyLimit: 100,
                remainingRequests: 75,
                usagePercentage: 25,
                timeUntilReset: '14h 30m',
            });
        });
        it('should render full display with budget information', async () => {
            const { getByText } = render(_jsx(BudgetDisplay, { ...defaultProps }));
            await act(async () => {
                vi.runAllTimers();
            });
            expect(getByText(/budget:/)).toBeInTheDocument();
            expect(getByText('25/100')).toBeInTheDocument();
            expect(getByText('75 left')).toBeInTheDocument();
            expect(getByText('• 14h 30m')).toBeInTheDocument();
        });
        it('should display progress bar in full mode', async () => {
            const { container } = render(_jsx(BudgetDisplay, { ...defaultProps }));
            await act(async () => {
                vi.runAllTimers();
            });
            // Look for progress bar characters
            const progressText = container.textContent;
            expect(progressText).toMatch(/[█░]/); // Should contain progress bar characters
        });
        it('should show exceeded status when over budget', async () => {
            mockTracker.getUsageStats.mockResolvedValue({
                requestCount: 105,
                dailyLimit: 100,
                remainingRequests: 0,
                usagePercentage: 105,
                timeUntilReset: '23h 45m',
            });
            const { getByText, queryByText } = render(_jsx(BudgetDisplay, { ...defaultProps }));
            await act(async () => {
                vi.runAllTimers();
            });
            expect(getByText('105/100')).toBeInTheDocument();
            expect(getByText('exceeded')).toBeInTheDocument();
            expect(queryByText(/\d+h \d+m/)).not.toBeInTheDocument(); // Time until reset should not show when exceeded
        });
        it('should display remaining requests when under budget', async () => {
            mockTracker.getUsageStats.mockResolvedValue({
                requestCount: 45,
                dailyLimit: 100,
                remainingRequests: 55,
                usagePercentage: 45,
                timeUntilReset: '18h 15m',
            });
            const { getByText } = render(_jsx(BudgetDisplay, { ...defaultProps }));
            await act(async () => {
                vi.runAllTimers();
            });
            expect(getByText('45/100')).toBeInTheDocument();
            expect(getByText('55 left')).toBeInTheDocument();
            expect(getByText('• 18h 15m')).toBeInTheDocument();
        });
    });
    describe('Compact Display Mode', () => {
        beforeEach(() => {
            mockTracker.getUsageStats.mockResolvedValue({
                requestCount: 33,
                dailyLimit: 100,
                remainingRequests: 67,
                usagePercentage: 33,
                timeUntilReset: '12h 30m',
            });
        });
        it('should render compact display with essential information', async () => {
            const { getByText, queryByText } = render(_jsx(BudgetDisplay, { ...defaultProps, compact: true }));
            await act(async () => {
                vi.runAllTimers();
            });
            expect(getByText('33/100')).toBeInTheDocument();
            expect(getByText('(33%)')).toBeInTheDocument();
            // Compact mode should not show detailed information
            expect(queryByText(/budget:/)).not.toBeInTheDocument();
            expect(queryByText(/left/)).not.toBeInTheDocument();
            expect(queryByText(/\d+h \d+m/)).not.toBeInTheDocument();
        });
        it('should not display progress bar in compact mode', async () => {
            const { container } = render(_jsx(BudgetDisplay, { ...defaultProps, compact: true }));
            await act(async () => {
                vi.runAllTimers();
            });
            const progressText = container.textContent;
            expect(progressText).not.toMatch(/[█░]/); // Should not contain progress bar characters
        });
    });
    describe('Usage Color Coding', () => {
        it('should use success color for low usage (under 75%)', async () => {
            mockTracker.getUsageStats.mockResolvedValue({
                requestCount: 50,
                dailyLimit: 100,
                remainingRequests: 50,
                usagePercentage: 50,
                timeUntilReset: '12h 0m',
            });
            const { container } = render(_jsx(BudgetDisplay, { ...defaultProps }));
            await act(async () => {
                vi.runAllTimers();
            });
            // In the mocked theme, success color is 'green'
            const textElements = container.querySelectorAll('*');
            const hasGreenColor = Array.from(textElements).some((el) => el.getAttribute('color') === 'green');
            expect(hasGreenColor).toBe(true);
        });
        it('should use warning color for medium usage (75-89%)', async () => {
            mockTracker.getUsageStats.mockResolvedValue({
                requestCount: 80,
                dailyLimit: 100,
                remainingRequests: 20,
                usagePercentage: 80,
                timeUntilReset: '8h 30m',
            });
            const { container } = render(_jsx(BudgetDisplay, { ...defaultProps }));
            await act(async () => {
                vi.runAllTimers();
            });
            // In the mocked theme, warning color is 'yellow'
            const textElements = container.querySelectorAll('*');
            const hasYellowColor = Array.from(textElements).some((el) => el.getAttribute('color') === 'yellow');
            expect(hasYellowColor).toBe(true);
        });
        it('should use error color for high usage (90%+)', async () => {
            mockTracker.getUsageStats.mockResolvedValue({
                requestCount: 95,
                dailyLimit: 100,
                remainingRequests: 5,
                usagePercentage: 95,
                timeUntilReset: '2h 15m',
            });
            const { container } = render(_jsx(BudgetDisplay, { ...defaultProps }));
            await act(async () => {
                vi.runAllTimers();
            });
            // In the mocked theme, error color is 'red'
            const textElements = container.querySelectorAll('*');
            const hasRedColor = Array.from(textElements).some((el) => el.getAttribute('color') === 'red');
            expect(hasRedColor).toBe(true);
        });
        it('should use error color for exceeded usage (100%+)', async () => {
            mockTracker.getUsageStats.mockResolvedValue({
                requestCount: 110,
                dailyLimit: 100,
                remainingRequests: 0,
                usagePercentage: 110,
                timeUntilReset: '23h 45m',
            });
            const { container } = render(_jsx(BudgetDisplay, { ...defaultProps }));
            await act(async () => {
                vi.runAllTimers();
            });
            // In the mocked theme, error color is 'red'
            const textElements = container.querySelectorAll('*');
            const hasRedColor = Array.from(textElements).some((el) => el.getAttribute('color') === 'red');
            expect(hasRedColor).toBe(true);
        });
    });
    describe('Progress Bar Functionality', () => {
        it('should create progress bar with correct fill ratio for 25% usage', async () => {
            mockTracker.getUsageStats.mockResolvedValue({
                requestCount: 25,
                dailyLimit: 100,
                remainingRequests: 75,
                usagePercentage: 25,
                timeUntilReset: '14h 30m',
            });
            const { container } = render(_jsx(BudgetDisplay, { ...defaultProps }));
            await act(async () => {
                vi.runAllTimers();
            });
            const progressText = container.textContent;
            // For 25% of 8 character width = 2 filled, 6 empty
            expect(progressText).toContain('██░░░░░░');
        });
        it('should create progress bar with correct fill ratio for 75% usage', async () => {
            mockTracker.getUsageStats.mockResolvedValue({
                requestCount: 75,
                dailyLimit: 100,
                remainingRequests: 25,
                usagePercentage: 75,
                timeUntilReset: '8h 30m',
            });
            const { container } = render(_jsx(BudgetDisplay, { ...defaultProps }));
            await act(async () => {
                vi.runAllTimers();
            });
            const progressText = container.textContent;
            // For 75% of 8 character width = 6 filled, 2 empty
            expect(progressText).toContain('██████░░');
        });
        it('should create full progress bar for 100% usage', async () => {
            mockTracker.getUsageStats.mockResolvedValue({
                requestCount: 100,
                dailyLimit: 100,
                remainingRequests: 0,
                usagePercentage: 100,
                timeUntilReset: '23h 59m',
            });
            const { container } = render(_jsx(BudgetDisplay, { ...defaultProps }));
            await act(async () => {
                vi.runAllTimers();
            });
            const progressText = container.textContent;
            // For 100% of 8 character width = 8 filled, 0 empty
            expect(progressText).toContain('████████');
        });
        it('should handle custom progress bar width', async () => {
            mockTracker.getUsageStats.mockResolvedValue({
                requestCount: 50,
                dailyLimit: 100,
                remainingRequests: 50,
                usagePercentage: 50,
                timeUntilReset: '12h 0m',
            });
            const { container } = render(_jsx(BudgetDisplay, { ...defaultProps }));
            await act(async () => {
                vi.runAllTimers();
            });
            const progressText = container.textContent;
            // Default width is 8, so 50% = 4 filled, 4 empty
            expect(progressText).toContain('████░░░░');
        });
    });
    describe('Data Refresh and Updates', () => {
        it('should refresh data every 30 seconds', async () => {
            const mockStats1 = {
                requestCount: 25,
                dailyLimit: 100,
                remainingRequests: 75,
                usagePercentage: 25,
                timeUntilReset: '14h 30m',
            };
            const mockStats2 = {
                requestCount: 30,
                dailyLimit: 100,
                remainingRequests: 70,
                usagePercentage: 30,
                timeUntilReset: '14h 25m',
            };
            mockTracker.getUsageStats
                .mockResolvedValueOnce(mockStats1)
                .mockResolvedValueOnce(mockStats2);
            const { getByText } = render(_jsx(BudgetDisplay, { ...defaultProps }));
            // Initial load
            await act(async () => {
                vi.runAllTimers();
            });
            expect(getByText('25/100')).toBeInTheDocument();
            // Advance time by 30 seconds to trigger refresh
            await act(async () => {
                vi.advanceTimersByTime(30000);
                vi.runAllTimers();
            });
            expect(getByText('30/100')).toBeInTheDocument();
            expect(mockTracker.getUsageStats).toHaveBeenCalledTimes(2);
        });
        it('should handle refresh errors gracefully', async () => {
            mockTracker.getUsageStats
                .mockResolvedValueOnce({
                requestCount: 25,
                dailyLimit: 100,
                remainingRequests: 75,
                usagePercentage: 25,
                timeUntilReset: '14h 30m',
            })
                .mockRejectedValueOnce(new Error('Refresh failed'));
            const { getByText } = render(_jsx(BudgetDisplay, { ...defaultProps }));
            // Initial load
            await act(async () => {
                vi.runAllTimers();
            });
            expect(getByText('25/100')).toBeInTheDocument();
            // Advance time to trigger refresh that will fail
            await act(async () => {
                vi.advanceTimersByTime(30000);
                vi.runAllTimers();
            });
            // Component should still display original data
            expect(getByText('25/100')).toBeInTheDocument();
            expect(consoleSpy).toHaveBeenCalledWith('Failed to load budget stats:', expect.any(Error));
        });
        it('should cleanup interval on unmount', async () => {
            mockTracker.getUsageStats.mockResolvedValue({
                requestCount: 25,
                dailyLimit: 100,
                remainingRequests: 75,
                usagePercentage: 25,
                timeUntilReset: '14h 30m',
            });
            const { unmount } = render(_jsx(BudgetDisplay, { ...defaultProps }));
            await act(async () => {
                vi.runAllTimers();
            });
            unmount();
            // Advance time after unmount - should not trigger more calls
            const initialCallCount = mockTracker.getUsageStats.mock.calls.length;
            await act(async () => {
                vi.advanceTimersByTime(30000);
                vi.runAllTimers();
            });
            expect(mockTracker.getUsageStats).toHaveBeenCalledTimes(initialCallCount);
        });
    });
    describe('Props Updates', () => {
        it('should reload data when budget settings change', async () => {
            mockTracker.getUsageStats.mockResolvedValue({
                requestCount: 25,
                dailyLimit: 100,
                remainingRequests: 75,
                usagePercentage: 25,
                timeUntilReset: '14h 30m',
            });
            const { rerender } = render(_jsx(BudgetDisplay, { ...defaultProps }));
            await act(async () => {
                vi.runAllTimers();
            });
            expect(mockTracker.getUsageStats).toHaveBeenCalledTimes(1);
            // Change budget settings
            const newSettings = { ...budgetSettings, dailyLimit: 200 };
            rerender(_jsx(BudgetDisplay, { ...defaultProps, budgetSettings: newSettings }));
            await act(async () => {
                vi.runAllTimers();
            });
            expect(mockTracker.getUsageStats).toHaveBeenCalledTimes(2);
            expect(createBudgetTracker).toHaveBeenCalledWith('/test/project', newSettings);
        });
        it('should reload data when project root changes', async () => {
            mockTracker.getUsageStats.mockResolvedValue({
                requestCount: 25,
                dailyLimit: 100,
                remainingRequests: 75,
                usagePercentage: 25,
                timeUntilReset: '14h 30m',
            });
            const { rerender } = render(_jsx(BudgetDisplay, { ...defaultProps }));
            await act(async () => {
                vi.runAllTimers();
            });
            expect(mockTracker.getUsageStats).toHaveBeenCalledTimes(1);
            // Change project root
            rerender(_jsx(BudgetDisplay, { ...defaultProps, projectRoot: "/new/project" }));
            await act(async () => {
                vi.runAllTimers();
            });
            expect(mockTracker.getUsageStats).toHaveBeenCalledTimes(2);
            expect(createBudgetTracker).toHaveBeenCalledWith('/new/project', budgetSettings);
        });
    });
    describe('Edge Cases and Error Handling', () => {
        it('should handle zero daily limit', async () => {
            mockTracker.getUsageStats.mockResolvedValue({
                requestCount: 0,
                dailyLimit: 0,
                remainingRequests: 0,
                usagePercentage: 0,
                timeUntilReset: '24h 0m',
            });
            const { getByText } = render(_jsx(BudgetDisplay, { ...defaultProps }));
            await act(async () => {
                vi.runAllTimers();
            });
            expect(getByText('0/0')).toBeInTheDocument();
            expect(getByText('exceeded')).toBeInTheDocument(); // 0 remaining should show exceeded
        });
        it('should handle negative remaining requests', async () => {
            mockTracker.getUsageStats.mockResolvedValue({
                requestCount: 150,
                dailyLimit: 100,
                remainingRequests: -50,
                usagePercentage: 150,
                timeUntilReset: '20h 0m',
            });
            const { getByText } = render(_jsx(BudgetDisplay, { ...defaultProps }));
            await act(async () => {
                vi.runAllTimers();
            });
            expect(getByText('150/100')).toBeInTheDocument();
            expect(getByText('exceeded')).toBeInTheDocument();
        });
        it('should handle undefined usage percentage', async () => {
            mockTracker.getUsageStats.mockResolvedValue({
                requestCount: 25,
                dailyLimit: 100,
                remainingRequests: 75,
                usagePercentage: undefined,
                timeUntilReset: '14h 30m',
            });
            const { container } = render(_jsx(BudgetDisplay, { ...defaultProps }));
            await act(async () => {
                vi.runAllTimers();
            });
            // Should not crash and should render something
            expect(container.textContent).toContain('25/100');
        });
        it('should handle empty time until reset', async () => {
            mockTracker.getUsageStats.mockResolvedValue({
                requestCount: 25,
                dailyLimit: 100,
                remainingRequests: 75,
                usagePercentage: 25,
                timeUntilReset: '',
            });
            const { getByText } = render(_jsx(BudgetDisplay, { ...defaultProps }));
            await act(async () => {
                vi.runAllTimers();
            });
            expect(getByText('25/100')).toBeInTheDocument();
            expect(getByText('75 left')).toBeInTheDocument();
            // Should still show time section but with empty string
            expect(getByText('•')).toBeInTheDocument();
        });
        it('should handle extreme usage values', async () => {
            mockTracker.getUsageStats.mockResolvedValue({
                requestCount: Number.MAX_SAFE_INTEGER,
                dailyLimit: Number.MAX_SAFE_INTEGER,
                remainingRequests: 0,
                usagePercentage: 100,
                timeUntilReset: 'Never',
            });
            const { container } = render(_jsx(BudgetDisplay, { ...defaultProps }));
            await act(async () => {
                vi.runAllTimers();
            });
            expect(container.textContent).toContain(Number.MAX_SAFE_INTEGER.toString());
        });
        it('should handle malformed budget tracker creation', async () => {
            vi.mocked(createBudgetTracker).mockImplementation(() => {
                throw new Error('Tracker creation failed');
            });
            const { container } = render(_jsx(BudgetDisplay, { ...defaultProps }));
            await act(async () => {
                vi.runAllTimers();
            });
            expect(container.firstChild).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith('Failed to load budget stats:', expect.any(Error));
        });
        it('should handle percentage rounding edge cases', async () => {
            mockTracker.getUsageStats.mockResolvedValue({
                requestCount: 33,
                dailyLimit: 100,
                remainingRequests: 67,
                usagePercentage: 33.333333333,
                timeUntilReset: '16h 40m',
            });
            const { getByText } = render(_jsx(BudgetDisplay, { ...defaultProps, compact: true }));
            await act(async () => {
                vi.runAllTimers();
            });
            // Should round to nearest integer in compact mode
            expect(getByText('(33%)')).toBeInTheDocument();
        });
    });
    describe('Accessibility and Usability', () => {
        it('should provide meaningful text content for screen readers', async () => {
            mockTracker.getUsageStats.mockResolvedValue({
                requestCount: 75,
                dailyLimit: 100,
                remainingRequests: 25,
                usagePercentage: 75,
                timeUntilReset: '8h 15m',
            });
            const { container } = render(_jsx(BudgetDisplay, { ...defaultProps }));
            await act(async () => {
                vi.runAllTimers();
            });
            const textContent = container.textContent;
            expect(textContent).toContain('budget');
            expect(textContent).toContain('75/100');
            expect(textContent).toContain('25 left');
            expect(textContent).toContain('8h 15m');
        });
        it('should maintain consistent layout structure', async () => {
            mockTracker.getUsageStats.mockResolvedValue({
                requestCount: 50,
                dailyLimit: 100,
                remainingRequests: 50,
                usagePercentage: 50,
                timeUntilReset: '12h 0m',
            });
            const { container } = render(_jsx(BudgetDisplay, { ...defaultProps }));
            await act(async () => {
                vi.runAllTimers();
            });
            // Should have consistent Box wrapper structure
            const boxes = container.querySelectorAll('div');
            expect(boxes.length).toBeGreaterThan(0);
        });
        it('should handle rapid prop changes gracefully', async () => {
            mockTracker.getUsageStats.mockResolvedValue({
                requestCount: 25,
                dailyLimit: 100,
                remainingRequests: 75,
                usagePercentage: 25,
                timeUntilReset: '14h 30m',
            });
            const { rerender } = render(_jsx(BudgetDisplay, { ...defaultProps }));
            await act(async () => {
                vi.runAllTimers();
            });
            // Rapidly change between compact and full mode
            for (let i = 0; i < 5; i++) {
                rerender(_jsx(BudgetDisplay, { ...defaultProps, compact: i % 2 === 0 }));
                await act(async () => {
                    vi.runOnlyPendingTimers();
                });
            }
            // Should not crash and should still render
            expect(mockTracker.getUsageStats).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=BudgetDisplay.test.js.map