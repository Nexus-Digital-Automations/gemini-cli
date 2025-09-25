/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsx as _jsx } from 'react/jsx-runtime';
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { render } from 'ink-testing-library';
import { KeypressProvider } from '../ui/contexts/KeypressContext.js';
import { ShellFocusContext } from '../ui/contexts/ShellFocusContext.js';
export const renderWithProviders = (component, { shellFocus = true } = {}) =>
  render(
    _jsx(ShellFocusContext.Provider, {
      value: shellFocus,
      children: _jsx(KeypressProvider, {
        kittyProtocolEnabled: true,
        children: component,
      }),
    }),
  );
//# sourceMappingURL=render.js.map
