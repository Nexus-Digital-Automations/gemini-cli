/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
/**
 * Props for the Header component.
 * Configures the application header display and branding.
 */
interface HeaderProps {
    customAsciiArt?: string;
    version: string;
    nightly: boolean;
}
/**
 * Header displays the application logo and version information.
 *
 * This component renders the CLI application's ASCII art logo with appropriate
 * sizing based on terminal width. It supports custom ASCII art, gradient themes,
 * and responsive display modes for different terminal sizes.
 *
 * Features:
 * - Responsive logo sizing (long, short, tiny) based on terminal width
 * - Optional gradient theming support
 * - Custom ASCII art support for branding customization
 * - Version display for nightly builds
 *
 * @param props - Configuration for header display and branding
 * @returns A React component showing the application header
 *
 * @example
 * ```tsx
 * <Header
 *   version="1.0.0"
 *   nightly={true}
 *   customAsciiArt={myCustomLogo}
 * />
 * ```
 */
export declare const Header: React.FC<HeaderProps>;
export {};
