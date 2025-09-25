/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Text } from 'ink';
import { theme } from '../../semantic-colors.js';
import { BaseSelectionList } from './BaseSelectionList.js';
/**
 * A custom component that displays a list of items with radio buttons,
 * supporting scrolling and keyboard navigation.
 *
 * @template T The type of the value associated with each radio item.
 */
export function RadioButtonSelect({ items, initialIndex = 0, onSelect, onHighlight, isFocused = true, showScrollArrows = false, maxItemsToShow = 10, showNumbers = true, }) {
    return (_jsx(BaseSelectionList, { items, initialIndex, onSelect, onHighlight, isFocused, showNumbers, showScrollArrows, maxItemsToShow, renderItem: (item, { titleColor }) => {
            // Handle special theme display case for ThemeDialog compatibility
            if (item.themeNameDisplay && item.themeTypeDisplay) {
                return (_jsxs(Text, { color: titleColor, wrap: "truncate", children: [item.themeNameDisplay, ' ', _jsx(Text, { color: theme.text.secondary, children: item.themeTypeDisplay })] }));
            }
            // Regular label display
            return (_jsx(Text, { color: titleColor, wrap: "truncate", children: item.label }));
        } }));
}
//# sourceMappingURL=RadioButtonSelect.js.map