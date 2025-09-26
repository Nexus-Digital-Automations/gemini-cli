/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { useMemo } from 'react';
import { LoadingIndicator } from './LoadingIndicator.js';
import { ContextSummaryDisplay } from './ContextSummaryDisplay.js';
import { AutoAcceptIndicator } from './AutoAcceptIndicator.js';
import { ShellModeIndicator } from './ShellModeIndicator.js';
import { DetailedMessagesDisplay } from './DetailedMessagesDisplay.js';
import { InputPrompt, calculatePromptWidths } from './InputPrompt.js';
import { Footer } from './Footer.js';
import { ShowMoreLines } from './ShowMoreLines.js';
import { QueuedMessageDisplay } from './QueuedMessageDisplay.js';
import { OverflowProvider } from '../contexts/OverflowContext.js';
import { theme } from '../semantic-colors.js';
import { isNarrowWidth } from '../utils/isNarrowWidth.js';
import { useUIState } from '../contexts/UIStateContext.js';
import { useUIActions } from '../contexts/UIActionsContext.js';
import { useVimMode } from '../contexts/VimModeContext.js';
import { useConfig } from '../contexts/ConfigContext.js';
import { useSettings } from '../contexts/SettingsContext.js';
import { useProgress } from '../contexts/ProgressContext.js';
import { ProgressPanel } from './ProgressPanel.js';
import { ApprovalMode } from '@google/gemini-cli-core';
import { StreamingState } from '../types.js';
import { ConfigInitDisplay } from '../components/ConfigInitDisplay.js';
/**
 * Composer is the main orchestrator component for the CLI interface.
 *
 * This component combines all major UI elements including the header, input prompt,
 * message display, footer, and various dialogs. It manages the overall layout
 * and coordinates between different UI contexts and state management systems.
 *
 * The Composer handles:
 * - Layout coordination between all major UI components
 * - Context state aggregation from multiple providers
 * - Responsive design for different terminal sizes
 * - Configuration initialization flows
 * - Progress panel management
 * - Dialog and notification orchestration
 *
 * @returns The complete CLI interface combining all UI components
 *
 * @example
 * ```tsx
 * // Typically used as the root UI component
 * <Composer />
 * ```
 */
export const Composer = () => {
    const config = useConfig();
    const settings = useSettings();
    const uiState = useUIState();
    const uiActions = useUIActions();
    const { vimEnabled, vimMode } = useVimMode();
    const { primaryOperation, isProgressPanelExpanded, toggleProgressPanel } = useProgress();
    const terminalWidth = process.stdout.columns;
    const isNarrow = isNarrowWidth(terminalWidth);
    const debugConsoleMaxHeight = Math.floor(Math.max(terminalWidth * 0.2, 5));
    const { contextFileNames, showAutoAcceptIndicator } = uiState;
    // Use the container width of InputPrompt for width of DetailedMessagesDisplay
    const { containerWidth } = useMemo(() => calculatePromptWidths(uiState.terminalWidth), [uiState.terminalWidth]);
    // Build footer props from context values
    const footerProps = {
        model: config.getModel(),
        targetDir: config.getTargetDir(),
        debugMode: config.getDebugMode(),
        branchName: uiState.branchName,
        debugMessage: uiState.debugMessage,
        corgiMode: uiState.corgiMode,
        errorCount: uiState.errorCount,
        showErrorDetails: uiState.showErrorDetails,
        showMemoryUsage: config.getDebugMode() || settings.merged.ui?.showMemoryUsage || false,
        promptTokenCount: uiState.sessionStats.lastPromptTokenCount,
        nightly: uiState.nightly,
        isTrustedFolder: uiState.isTrustedFolder,
        hideCWD: settings.merged.ui?.footer?.hideCWD || false,
        hideSandboxStatus: settings.merged.ui?.footer?.hideSandboxStatus || false,
        hideModelInfo: settings.merged.ui?.footer?.hideModelInfo || false,
        sandboxConfig: config.getSandbox(),
    };
    return (_jsxs(Box, { flexDirection: "column", children: [!uiState.embeddedShellFocused && (_jsx(LoadingIndicator, { thought: uiState.streamingState === StreamingState.WaitingForConfirmation ||
                    config.getAccessibility()?.disableLoadingPhrases
                    ? undefined
                    : uiState.thought, currentLoadingPhrase: config.getAccessibility()?.disableLoadingPhrases
                    ? undefined
                    : uiState.currentLoadingPhrase, elapsedTime: uiState.elapsedTime })), !uiState.isConfigInitialized && _jsx(ConfigInitDisplay, {}), _jsx(QueuedMessageDisplay, { messageQueue: uiState.messageQueue }), _jsxs(Box, { marginTop: 1, justifyContent: settings.merged.ui?.hideContextSummary
                    ? 'flex-start'
                    : 'space-between', width: "100%", flexDirection: isNarrow ? 'column' : 'row', alignItems: isNarrow ? 'flex-start' : 'center', children: [_jsxs(Box, { marginRight: 1, children: [process.env['GEMINI_SYSTEM_MD'] && (_jsx(Text, { color: theme.status.error, children: "|\u2310\u25A0_\u25A0| " })), uiState.ctrlCPressedOnce ? (_jsx(Text, { color: theme.status.warning, children: "Press Ctrl+C again to exit." })) : uiState.ctrlDPressedOnce ? (_jsx(Text, { color: theme.status.warning, children: "Press Ctrl+D again to exit." })) : uiState.showEscapePrompt ? (_jsx(Text, { color: theme.text.secondary, children: "Press Esc again to clear." })) : (!settings.merged.ui?.hideContextSummary && (_jsx(ContextSummaryDisplay, { ideContext: uiState.ideContextState, geminiMdFileCount: uiState.geminiMdFileCount, contextFileNames, mcpServers: config.getMcpServers(), blockedMcpServers: config.getBlockedMcpServers(), showToolDescriptions: uiState.showToolDescriptions })))] }), _jsxs(Box, { paddingTop: isNarrow ? 1 : 0, children: [showAutoAcceptIndicator !== ApprovalMode.DEFAULT &&
                                !uiState.shellModeActive && (_jsx(AutoAcceptIndicator, { approvalMode: showAutoAcceptIndicator })), uiState.shellModeActive && _jsx(ShellModeIndicator, {})] })] }), uiState.showErrorDetails && (_jsx(OverflowProvider, { children: _jsxs(Box, { flexDirection: "column", children: [_jsx(DetailedMessagesDisplay, { messages: uiState.filteredConsoleMessages, maxHeight: uiState.constrainHeight ? debugConsoleMaxHeight : undefined, width: containerWidth }), _jsx(ShowMoreLines, { constrainHeight: uiState.constrainHeight })] }) })), uiState.isInputActive && (_jsx(InputPrompt, { buffer: uiState.buffer, inputWidth: uiState.inputWidth, suggestionsWidth: uiState.suggestionsWidth, onSubmit: uiActions.handleFinalSubmit, userMessages: uiState.userMessages, onClearScreen: uiActions.handleClearScreen, config, slashCommands: uiState.slashCommands, commandContext: uiState.commandContext, shellModeActive: uiState.shellModeActive, setShellModeActive: uiActions.setShellModeActive, approvalMode: showAutoAcceptIndicator, onEscapePromptChange: uiActions.onEscapePromptChange, focus: true, vimHandleInput: uiActions.vimHandleInput, isEmbeddedShellFocused: uiState.embeddedShellFocused, placeholder: vimEnabled
                    ? "  Press 'i' for INSERT mode and 'Esc' for NORMAL mode."
                    : '  Type your message or @path/to/file' })), primaryOperation && (_jsx(ProgressPanel, { isExpanded: isProgressPanelExpanded, onToggle: toggleProgressPanel, maxHeight: Math.floor(terminalWidth * 0.3) })), !settings.merged.ui?.hideFooter && (_jsx(Footer, { ...footerProps, vimMode: vimEnabled ? vimMode : undefined }))] }));
};
//# sourceMappingURL=Composer.js.map