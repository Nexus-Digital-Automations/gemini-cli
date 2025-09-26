import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { theme } from '../../../semantic-colors.js';
import { formatPercentage, formatTime } from '../utils/chartUtils.js';
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
export const BudgetAlertsPanel = ({ alerts, budgetStats, onDismissAlert, onModifyThresholds: _onModifyThresholds, }) => {
    const [selectedAlertIndex, setSelectedAlertIndex] = useState(0);
    const [showDismissed, setShowDismissed] = useState(false);
    // Sort alerts by severity and recency
    const sortedAlerts = [...alerts].sort((a, b) => {
        const severityOrder = { critical: 4, error: 3, warning: 2, info: 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0)
            return severityDiff;
        // Sort by recency if severity is the same
        return b.triggeredAt.getTime() - a.triggeredAt.getTime();
    });
    // Handle keyboard navigation
    useInput((input, key) => {
        if (key.upArrow || input === 'k') {
            setSelectedAlertIndex(Math.max(0, selectedAlertIndex - 1));
        }
        else if (key.downArrow || input === 'j') {
            setSelectedAlertIndex(Math.min(sortedAlerts.length - 1, selectedAlertIndex + 1));
        }
        else if (key.return || input === ' ') {
            // Dismiss selected alert
            const selectedAlert = sortedAlerts[selectedAlertIndex];
            if (selectedAlert && onDismissAlert) {
                onDismissAlert(selectedAlert.id);
                setSelectedAlertIndex(Math.max(0, selectedAlertIndex - 1));
            }
        }
        else if (input === 'd') {
            // Toggle show dismissed alerts
            setShowDismissed(!showDismissed);
        }
    });
    /**
     * Gets color for alert severity.
     */
    const getSeverityColor = (severity) => {
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
    const getSeverityIcon = (severity) => {
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
    const getTypeIcon = (type) => {
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
        const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
        const errorCount = alerts.filter((a) => a.severity === 'error').length;
        const warningCount = alerts.filter((a) => a.severity === 'warning').length;
        const activeCount = alerts.filter((a) => a.isActive).length;
        return (_jsxs(Box, { flexDirection: "column", marginBottom: 2, children: [_jsx(Text, { color: theme.text.primary, bold: true, marginBottom: 1, children: "Budget Alerts & Notifications" }), _jsxs(Box, { justifyContent: "space-between", marginBottom: 1, children: [_jsxs(Box, { gap: 4, children: [_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.muted, children: "Active" }), _jsx(Text, { color: activeCount > 0 ? theme.status.warning : theme.status.success, children: activeCount })] }), _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.muted, children: "Critical" }), _jsx(Text, { color: criticalCount > 0 ? theme.status.error : theme.text.secondary, children: criticalCount })] }), _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.muted, children: "Errors" }), _jsx(Text, { color: errorCount > 0 ? theme.status.error : theme.text.secondary, children: errorCount })] }), _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.muted, children: "Warnings" }), _jsx(Text, { color: warningCount > 0 ? theme.status.warning : theme.text.secondary, children: warningCount })] })] }), _jsxs(Box, { flexDirection: "column", alignItems: "flex-end", children: [_jsx(Text, { color: theme.text.muted, children: "Last Alert" }), _jsx(Text, { color: theme.text.secondary, children: alerts.length > 0
                                        ? formatTime(sortedAlerts[0].triggeredAt)
                                        : 'None' })] })] }), budgetStats && (_jsx(Box, { paddingX: 2, paddingY: 1, borderStyle: "single", borderColor: budgetStats.usagePercentage > 90
                        ? theme.status.error
                        : theme.text.muted, children: _jsxs(Text, { color: theme.text.secondary, children: ["Current Status: ", budgetStats.requestCount, "/", budgetStats.dailyLimit, " requests (", formatPercentage(budgetStats.usagePercentage), ") \u2022", ' ', budgetStats.remainingRequests, " remaining \u2022 Reset in", ' ', budgetStats.timeUntilReset] }) }))] }));
    };
    /**
     * Renders the list of active alerts.
     */
    const renderAlertsList = () => {
        if (sortedAlerts.length === 0) {
            return (_jsx(Box, { flexGrow: 1, justifyContent: "center", alignItems: "center", borderStyle: "single", paddingY: 3, children: _jsx(Text, { color: theme.status.success, children: "\u2705 No active alerts - Budget usage is within limits" }) }));
        }
        return (_jsxs(Box, { flexDirection: "column", flexGrow: 1, children: [_jsxs(Text, { color: theme.text.muted, marginBottom: 1, children: ["Active Alerts (", sortedAlerts.length, "):"] }), sortedAlerts.map((alert, index) => (_jsxs(Box, { flexDirection: "column", paddingX: 2, paddingY: 1, borderStyle: "single", borderColor: index === selectedAlertIndex
                        ? getSeverityColor(alert.severity)
                        : theme.text.muted, marginBottom: 1, backgroundColor: index === selectedAlertIndex ? theme.primary.light : undefined, children: [_jsxs(Box, { justifyContent: "space-between", alignItems: "center", marginBottom: 1, children: [_jsxs(Box, { gap: 1, alignItems: "center", children: [_jsx(Text, { children: getSeverityIcon(alert.severity) }), _jsx(Text, { children: getTypeIcon(alert.type) }), _jsx(Text, { color: getSeverityColor(alert.severity), bold: true, children: alert.title })] }), _jsx(Text, { color: theme.text.muted, children: formatTime(alert.triggeredAt) })] }), _jsx(Text, { color: theme.text.secondary, marginBottom: 1, children: alert.message }), _jsxs(Box, { justifyContent: "space-between", marginBottom: 1, children: [_jsxs(Box, { gap: 3, children: [_jsxs(Text, { color: theme.text.muted, children: ["Threshold: ", alert.threshold] }), _jsxs(Text, { color: theme.text.muted, children: ["Current: ", alert.currentValue] }), _jsxs(Text, { color: getSeverityColor(alert.severity), children: ["Severity: ", alert.severity] })] }), index === selectedAlertIndex && (_jsx(Text, { color: theme.text.muted, children: "Press Enter to dismiss" }))] }), index === selectedAlertIndex &&
                            alert.suggestedActions.length > 0 && (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { color: theme.text.muted, children: "Suggested Actions:" }), alert.suggestedActions.map((action, actionIndex) => (_jsxs(Text, { color: theme.text.secondary, marginTop: 1, children: ["\u2022 ", action] }, actionIndex)))] }))] }, alert.id)))] }));
    };
    /**
     * Renders alert threshold configuration.
     */
    const renderThresholdConfig = () => {
        const currentThresholds = [75, 90, 95]; // Default thresholds
        return (_jsxs(Box, { flexDirection: "column", marginTop: 2, children: [_jsx(Text, { color: theme.text.muted, marginBottom: 1, children: "Alert Thresholds:" }), _jsx(Box, { gap: 4, marginBottom: 1, children: currentThresholds.map((threshold, index) => (_jsxs(Box, { alignItems: "center", gap: 1, children: [_jsxs(Text, { color: theme.status.warning, children: [threshold, "%"] }), _jsx(Text, { color: theme.text.muted, children: index === 0 ? 'Warning' : index === 1 ? 'Error' : 'Critical' })] }, index))) }), _jsx(Text, { color: theme.text.muted, children: "\uD83D\uDCA1 Configure custom thresholds in dashboard settings" })] }));
    };
    /**
     * Renders alert statistics.
     */
    const renderAlertStats = () => {
        const todaysAlerts = alerts.filter((alert) => {
            const today = new Date();
            const alertDate = new Date(alert.triggeredAt);
            return (alertDate.getDate() === today.getDate() &&
                alertDate.getMonth() === today.getMonth() &&
                alertDate.getFullYear() === today.getFullYear());
        });
        const recentAlerts = alerts.filter((alert) => {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            return alert.triggeredAt > oneHourAgo;
        });
        return (_jsxs(Box, { flexDirection: "column", marginTop: 2, children: [_jsx(Text, { color: theme.text.muted, marginBottom: 1, children: "Alert Statistics:" }), _jsxs(Box, { gap: 4, children: [_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.muted, children: "Today" }), _jsx(Text, { color: theme.text.primary, children: todaysAlerts.length })] }), _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.muted, children: "Last Hour" }), _jsx(Text, { color: theme.text.primary, children: recentAlerts.length })] }), _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.muted, children: "Total" }), _jsx(Text, { color: theme.text.primary, children: alerts.length })] })] })] }));
    };
    /**
     * Renders the footer with keyboard shortcuts.
     */
    const renderFooter = () => (_jsxs(Box, { justifyContent: "space-between", marginTop: 2, paddingTop: 1, borderStyle: "single", borderTop: true, children: [_jsxs(Box, { gap: 4, children: [_jsx(Text, { color: theme.text.muted, children: "\u2191\u2193/jk: Navigate" }), _jsx(Text, { color: theme.text.muted, children: "Enter/Space: Dismiss" }), _jsx(Text, { color: theme.text.muted, children: "d: Toggle dismissed" })] }), _jsx(Text, { color: theme.text.muted, children: sortedAlerts.length > 0
                    ? `${selectedAlertIndex + 1}/${sortedAlerts.length}`
                    : 'No alerts' })] }));
    // Render the complete alerts panel
    return (_jsxs(Box, { flexDirection: "column", minHeight: 20, children: [renderAlertsHeader(), renderAlertsList(), alerts.length > 0 && renderThresholdConfig(), alerts.length > 0 && renderAlertStats(), renderFooter()] }));
};
//# sourceMappingURL=BudgetAlertsPanel.js.map