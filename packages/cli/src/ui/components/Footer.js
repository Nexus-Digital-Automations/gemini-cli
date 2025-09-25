/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { shortenPath, tildeifyPath } from '@google/gemini-cli-core';
import { ConsoleSummaryDisplay } from './ConsoleSummaryDisplay.js';
import process from 'node:process';
import path from 'node:path';
import Gradient from 'ink-gradient';
import { MemoryUsageDisplay } from './MemoryUsageDisplay.js';
import { ContextUsageDisplay } from './ContextUsageDisplay.js';
import { DebugProfiler } from './DebugProfiler.js';
import { BudgetDisplay } from './BudgetDisplay.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { isNarrowWidth } from '../utils/isNarrowWidth.js';
/**
 * Footer displays comprehensive status information at the bottom of the CLI.
 *
 * This component renders a status bar showing current directory, model information,
 * debug status, memory usage, context usage, budget status, and various other
 * system indicators. It adapts to different terminal widths and supports
 * optional information hiding for cleaner displays.
 *
 * Features:
 * - Current working directory with branch information
 * - AI model and configuration status
 * - Memory and context usage indicators
 * - Budget tracking and quota displays
 * - Debug mode indicators and error counts
 * - Sandbox status and trust indicators
 * - Responsive layout for narrow terminals
 * - Gradient theming support
 *
 * @param props - Configuration for footer display elements and behavior
 * @returns A React component showing comprehensive CLI status
 *
 * @example
 * ```tsx
 * <Footer
 *   model="gemini-pro"
 *   targetDir="/path/to/project"
 *   debugMode={false}
 *   showMemoryUsage={true}
 *   budgetSettings={budgetConfig}
 * />
 * ```
 */
export const Footer = ({ model, targetDir, branchName, debugMode, debugMessage, corgiMode, errorCount, showErrorDetails, showMemoryUsage, promptTokenCount, nightly, vimMode, isTrustedFolder, hideCWD = false, hideSandboxStatus = false, hideModelInfo = false, budgetSettings, showBudgetStatus = true, sandboxConfig, }) => {
    console.log('[DEBUG] Footer - sandboxConfig:', sandboxConfig);
    console.log('[DEBUG] Footer - process.env.SANDBOX:', process.env['SANDBOX']);
    console.log('[DEBUG] Footer - process.env.SEATBELT_PROFILE:', process.env['SEATBELT_PROFILE']);
    const { columns: terminalWidth } = useTerminalSize();
    const isNarrow = isNarrowWidth(terminalWidth);
    // Adjust path length based on terminal width
    const pathLength = Math.max(20, Math.floor(terminalWidth * 0.4));
    const displayPath = isNarrow
        ? path.basename(tildeifyPath(targetDir))
        : shortenPath(tildeifyPath(targetDir), pathLength);
    const justifyContent = hideCWD && hideModelInfo ? 'center' : 'space-between';
    return (_jsxs(Box, { justifyContent, width: "100%", flexDirection: isNarrow ? 'column' : 'row', alignItems: isNarrow ? 'flex-start' : 'center', children: [(debugMode || vimMode || !hideCWD) && (_jsxs(Box, { children: [debugMode && _jsx(DebugProfiler, {}), vimMode && _jsxs(Text, { color: theme.text.secondary, children: ["[", vimMode, "] "] }), !hideCWD &&
                        (nightly ? (_jsx(Gradient, { colors: theme.ui.gradient, children: _jsxs(Text, { children: [displayPath, branchName && _jsxs(Text, { children: [" (", branchName, "*)"] })] }) })) : (_jsxs(Text, { color: theme.text.link, children: [displayPath, branchName && (_jsxs(Text, { color: theme.text.secondary, children: [" (", branchName, "*)"] }))] }))), debugMode && (_jsx(Text, { color: theme.status.error, children: ' ' + (debugMessage || '--debug') }))] })), (!hideSandboxStatus ||
                (showBudgetStatus && budgetSettings?.enabled)) && (_jsxs(Box, { flexGrow: isNarrow || hideCWD || hideModelInfo ? 0 : 1, alignItems: "center", justifyContent: isNarrow || hideCWD ? 'flex-start' : 'center', display: "flex", flexDirection: isNarrow ? 'column' : 'row', paddingX: isNarrow ? 0 : 1, paddingTop: isNarrow ? 1 : 0, children: [!hideSandboxStatus && (_jsx(Box, { alignItems: "center", children: isTrustedFolder === false ? (_jsx(Text, { color: theme.status.warning, children: "untrusted" })) : process.env['SANDBOX'] &&
                            process.env['SANDBOX'] !== 'sandbox-exec' ? (_jsx(Text, { color: "green", children: process.env['SANDBOX'].replace(/^gemini-(?:cli-)?/, '') })) : process.env['SANDBOX'] === 'sandbox-exec' ? (_jsxs(Text, { color: theme.status.warning, children: ["macOS Seatbelt", ' ', _jsxs(Text, { color: theme.text.secondary, children: ["(", process.env['SEATBELT_PROFILE'], ")"] })] })) : sandboxConfig ? (sandboxConfig.command === 'sandbox-exec' ? (_jsxs(Text, { color: theme.status.warning, children: ["macOS Seatbelt", ' ', _jsxs(Text, { color: theme.text.secondary, children: ["(", process.env['SEATBELT_PROFILE'] || 'permissive-open', ")"] })] })) : (_jsx(Text, { color: "green", children: sandboxConfig.command }))) : (_jsxs(Text, { color: theme.status.error, children: ["no sandbox", ' ', _jsx(Text, { color: theme.text.secondary, children: "(see /docs)" })] })) })), showBudgetStatus && budgetSettings?.enabled && (_jsxs(Box, { alignItems: "center", paddingLeft: !hideSandboxStatus && !isNarrow ? 2 : 0, children: [!hideSandboxStatus && !isNarrow && (_jsx(Text, { color: theme.ui.comment, children: "| " })), _jsx(BudgetDisplay, { budgetSettings, projectRoot: targetDir, compact: isNarrow })] }))] })), (!hideModelInfo ||
                showMemoryUsage ||
                corgiMode ||
                (!showErrorDetails && errorCount > 0)) && (_jsxs(Box, { alignItems: "center", paddingTop: isNarrow ? 1 : 0, children: [!hideModelInfo && (_jsxs(Box, { alignItems: "center", children: [_jsxs(Text, { color: theme.text.accent, children: [isNarrow ? '' : ' ', model, ' ', _jsx(ContextUsageDisplay, { promptTokenCount, model })] }), showMemoryUsage && _jsx(MemoryUsageDisplay, {})] })), _jsxs(Box, { alignItems: "center", paddingLeft: 2, children: [corgiMode && (_jsxs(Text, { children: [!hideModelInfo && _jsx(Text, { color: theme.ui.comment, children: "| " }), _jsx(Text, { color: theme.status.error, children: "\u25BC" }), _jsx(Text, { color: theme.text.primary, children: "(\u00B4" }), _jsx(Text, { color: theme.status.error, children: "\u1D25" }), _jsx(Text, { color: theme.text.primary, children: "`)" }), _jsx(Text, { color: theme.status.error, children: "\u25BC " })] })), !showErrorDetails && errorCount > 0 && (_jsxs(Box, { children: [!hideModelInfo && _jsx(Text, { color: theme.ui.comment, children: "| " }), _jsx(ConsoleSummaryDisplay, { errorCount })] }))] })] }))] }));
};
//# sourceMappingURL=Footer.js.map