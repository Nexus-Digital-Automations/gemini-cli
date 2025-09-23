/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
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
import type { BudgetSettings } from '../../config/settingsSchema.js';
import type { SandboxConfig } from '@google/gemini-cli-core';

import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { isNarrowWidth } from '../utils/isNarrowWidth.js';

/**
 * Props for the Footer component.
 * Configures the comprehensive status information displayed in the footer.
 */
export interface FooterProps {
  model: string;
  targetDir: string;
  branchName?: string;
  debugMode: boolean;
  debugMessage: string;
  corgiMode: boolean;
  errorCount: number;
  showErrorDetails: boolean;
  showMemoryUsage?: boolean;
  promptTokenCount: number;
  nightly: boolean;
  vimMode?: string;
  isTrustedFolder?: boolean;
  hideCWD?: boolean;
  hideSandboxStatus?: boolean;
  hideModelInfo?: boolean;
  budgetSettings?: BudgetSettings;
  showBudgetStatus?: boolean;
  sandboxConfig?: SandboxConfig;
}

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
export const Footer: React.FC<FooterProps> = ({
  model,
  targetDir,
  branchName,
  debugMode,
  debugMessage,
  corgiMode,
  errorCount,
  showErrorDetails,
  showMemoryUsage,
  promptTokenCount,
  nightly,
  vimMode,
  isTrustedFolder,
  hideCWD = false,
  hideSandboxStatus = false,
  hideModelInfo = false,
  budgetSettings,
  showBudgetStatus = true,
  sandboxConfig,
}) => {
  const { columns: terminalWidth } = useTerminalSize();

  const isNarrow = isNarrowWidth(terminalWidth);

  // Adjust path length based on terminal width
  const pathLength = Math.max(20, Math.floor(terminalWidth * 0.4));
  const displayPath = isNarrow
    ? path.basename(tildeifyPath(targetDir))
    : shortenPath(tildeifyPath(targetDir), pathLength);

  const justifyContent = hideCWD && hideModelInfo ? 'center' : 'space-between';

  return (
    <Box
      justifyContent={justifyContent}
      width="100%"
      flexDirection={isNarrow ? 'column' : 'row'}
      alignItems={isNarrow ? 'flex-start' : 'center'}
    >
      {(debugMode || vimMode || !hideCWD) && (
        <Box>
          {debugMode && <DebugProfiler />}
          {vimMode && <Text color={theme.text.secondary}>[{vimMode}] </Text>}
          {!hideCWD &&
            (nightly ? (
              <Gradient colors={theme.ui.gradient}>
                <Text>
                  {displayPath}
                  {branchName && <Text> ({branchName}*)</Text>}
                </Text>
              </Gradient>
            ) : (
              <Text color={theme.text.link}>
                {displayPath}
                {branchName && (
                  <Text color={theme.text.secondary}> ({branchName}*)</Text>
                )}
              </Text>
            ))}
          {debugMode && (
            <Text color={theme.status.error}>
              {' ' + (debugMessage || '--debug')}
            </Text>
          )}
        </Box>
      )}

      {/* Middle Section: Centered Trust/Sandbox Info and Budget */}
      {(!hideSandboxStatus ||
        (showBudgetStatus && budgetSettings?.enabled)) && (
        <Box
          flexGrow={isNarrow || hideCWD || hideModelInfo ? 0 : 1}
          alignItems="center"
          justifyContent={isNarrow || hideCWD ? 'flex-start' : 'center'}
          display="flex"
          flexDirection={isNarrow ? 'column' : 'row'}
          paddingX={isNarrow ? 0 : 1}
          paddingTop={isNarrow ? 1 : 0}
        >
          {!hideSandboxStatus && (
            <Box alignItems="center">
              {isTrustedFolder === false ? (
                <Text color={theme.status.warning}>untrusted</Text>
              ) : process.env['SANDBOX'] &&
                process.env['SANDBOX'] !== 'sandbox-exec' ? (
                <Text color="green">
                  {process.env['SANDBOX'].replace(/^gemini-(?:cli-)?/, '')}
                </Text>
              ) : process.env['SANDBOX'] === 'sandbox-exec' ? (
                <Text color={theme.status.warning}>
                  macOS Seatbelt{' '}
                  <Text color={theme.text.secondary}>
                    ({process.env['SEATBELT_PROFILE']})
                  </Text>
                </Text>
              ) : sandboxConfig ? (
                sandboxConfig.command === 'sandbox-exec' ? (
                  <Text color={theme.status.warning}>
                    macOS Seatbelt{' '}
                    <Text color={theme.text.secondary}>
                      ({process.env['SEATBELT_PROFILE'] || 'permissive-open'})
                    </Text>
                  </Text>
                ) : (
                  <Text color="green">{sandboxConfig.command}</Text>
                )
              ) : (
                <Text color={theme.status.error}>
                  no sandbox{' '}
                  <Text color={theme.text.secondary}>(see /docs)</Text>
                </Text>
              )}
            </Box>
          )}

          {/* Budget Display */}
          {showBudgetStatus && budgetSettings?.enabled && (
            <Box
              alignItems="center"
              paddingLeft={!hideSandboxStatus && !isNarrow ? 2 : 0}
            >
              {!hideSandboxStatus && !isNarrow && (
                <Text color={theme.ui.comment}>| </Text>
              )}
              <BudgetDisplay
                budgetSettings={budgetSettings}
                projectRoot={targetDir}
                compact={isNarrow}
              />
            </Box>
          )}
        </Box>
      )}

      {/* Right Section: Gemini Label and Console Summary */}
      {(!hideModelInfo ||
        showMemoryUsage ||
        corgiMode ||
        (!showErrorDetails && errorCount > 0)) && (
        <Box alignItems="center" paddingTop={isNarrow ? 1 : 0}>
          {!hideModelInfo && (
            <Box alignItems="center">
              <Text color={theme.text.accent}>
                {isNarrow ? '' : ' '}
                {model}{' '}
                <ContextUsageDisplay
                  promptTokenCount={promptTokenCount}
                  model={model}
                />
              </Text>
              {showMemoryUsage && <MemoryUsageDisplay />}
            </Box>
          )}
          <Box alignItems="center" paddingLeft={2}>
            {corgiMode && (
              <Text>
                {!hideModelInfo && <Text color={theme.ui.comment}>| </Text>}
                <Text color={theme.status.error}>▼</Text>
                <Text color={theme.text.primary}>(´</Text>
                <Text color={theme.status.error}>ᴥ</Text>
                <Text color={theme.text.primary}>`)</Text>
                <Text color={theme.status.error}>▼ </Text>
              </Text>
            )}
            {!showErrorDetails && errorCount > 0 && (
              <Box>
                {!hideModelInfo && <Text color={theme.ui.comment}>| </Text>}
                <ConsoleSummaryDisplay errorCount={errorCount} />
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};
