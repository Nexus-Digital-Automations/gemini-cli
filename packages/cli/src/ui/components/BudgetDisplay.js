import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { createBudgetTracker } from '@google/gemini-cli-core';
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
export const BudgetDisplay = ({ budgetSettings, projectRoot, compact = false, }) => {
    const [budgetStats, setBudgetStats] = useState(null);
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
            }
            catch (error) {
                console.warn('Failed to load budget stats:', error);
            }
            finally {
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
    const { requestCount, dailyLimit, remainingRequests, usagePercentage, timeUntilReset, } = budgetStats;
    /**
     * Determines the appropriate color for usage display based on percentage.
     * Uses theme colors to indicate usage levels: green (safe), yellow (warning), red (danger).
     *
     * @returns The appropriate theme color for current usage level
     */
    const getUsageColor = () => {
        if (usagePercentage >= 100)
            return theme.status.error;
        if (usagePercentage >= 90)
            return theme.status.error;
        if (usagePercentage >= 75)
            return theme.status.warning;
        return theme.status.success;
    };
    /**
     * Creates a visual progress bar using Unicode block characters.
     * Represents usage percentage as filled and empty blocks.
     *
     * @param width - The total width of the progress bar in characters
     * @returns A string representing the visual progress bar
     */
    const createProgressBar = (width = 10) => {
        const filled = Math.round((usagePercentage / 100) * width);
        const empty = width - filled;
        return '█'.repeat(filled) + '░'.repeat(empty);
    };
    if (compact) {
        // Compact display for narrow terminals
        return (_jsxs(Box, { alignItems: "center", children: [_jsxs(Text, { color: getUsageColor(), children: [requestCount, "/", dailyLimit] }), _jsxs(Text, { color: theme.text.secondary, children: [' ', "(", usagePercentage.toFixed(0), "%)"] })] }));
    }
    // Full display
    return (_jsxs(Box, { alignItems: "center", children: [_jsx(Text, { color: theme.text.secondary, children: "budget: " }), _jsxs(Text, { color: getUsageColor(), children: [requestCount, "/", dailyLimit] }), _jsx(Text, { color: theme.text.secondary, children: " [" }), _jsx(Text, { color: getUsageColor(), children: createProgressBar(8) }), _jsx(Text, { color: theme.text.secondary, children: "] " }), _jsx(Text, { color: theme.text.secondary, children: remainingRequests > 0 ? `${remainingRequests} left` : 'exceeded' }), remainingRequests > 0 && (_jsxs(Text, { color: theme.text.muted, children: [" \u2022 ", timeUntilReset] }))] }));
};
//# sourceMappingURL=BudgetDisplay.js.map