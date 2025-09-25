/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import Gradient from 'ink-gradient';
import { theme } from '../semantic-colors.js';
import { shortAsciiLogo, longAsciiLogo, tinyAsciiLogo } from './AsciiArt.js';
import { getAsciiArtWidth } from '../utils/textUtils.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
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
export const Header = ({ customAsciiArt, version, nightly, }) => {
    const { columns: terminalWidth } = useTerminalSize();
    let displayTitle;
    const widthOfLongLogo = getAsciiArtWidth(longAsciiLogo);
    const widthOfShortLogo = getAsciiArtWidth(shortAsciiLogo);
    if (customAsciiArt) {
        displayTitle = customAsciiArt;
    }
    else if (terminalWidth >= widthOfLongLogo) {
        displayTitle = longAsciiLogo;
    }
    else if (terminalWidth >= widthOfShortLogo) {
        displayTitle = shortAsciiLogo;
    }
    else {
        displayTitle = tinyAsciiLogo;
    }
    const artWidth = getAsciiArtWidth(displayTitle);
    return (_jsxs(Box, { alignItems: "flex-start", width: artWidth, flexShrink: 0, flexDirection: "column", children: [theme.ui.gradient ? (_jsx(Gradient, { colors: theme.ui.gradient, children: _jsx(Text, { children: displayTitle }) })) : (_jsx(Text, { children: displayTitle })), nightly && (_jsx(Box, { width: "100%", flexDirection: "row", justifyContent: "flex-end", children: theme.ui.gradient ? (_jsx(Gradient, { colors: theme.ui.gradient, children: _jsxs(Text, { children: ["v", version] }) })) : (_jsxs(Text, { children: ["v", version] })) }))] }));
};
//# sourceMappingURL=Header.js.map