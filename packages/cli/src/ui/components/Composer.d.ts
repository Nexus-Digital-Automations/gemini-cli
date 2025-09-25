/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
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
export declare const Composer: () => import("react/jsx-runtime").JSX.Element;
