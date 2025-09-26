/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import type { BudgetSettings } from '../../config/settingsSchema.js';
import type { SandboxConfig } from '@google/gemini-cli-core';
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
export declare const Footer: React.FC<FooterProps>;
