/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Box, Text } from 'ink';
import { StreamingContext } from './contexts/StreamingContext.js';
import { ProgressProvider } from './contexts/ProgressContext.js';
import { Notifications } from './components/Notifications.js';
import { MainContent } from './components/MainContent.js';
import { DialogManager } from './components/DialogManager.js';
import { Composer } from './components/Composer.js';
import { useUIState } from './contexts/UIStateContext.js';
import { QuittingDisplay } from './components/QuittingDisplay.js';
import { theme } from './semantic-colors.js';
export const App = () => {
  const uiState = useUIState();
  if (uiState.quittingMessages) {
    return _jsx(QuittingDisplay, {});
  }
  return _jsx(StreamingContext.Provider, {
    value: uiState.streamingState,
    children: _jsx(ProgressProvider, {
      children: _jsxs(Box, {
        flexDirection: 'column',
        width: '90%',
        children: [
          _jsx(MainContent, {}),
          _jsxs(Box, {
            flexDirection: 'column',
            ref: uiState.mainControlsRef,
            children: [
              _jsx(Notifications, {}),
              uiState.dialogsVisible
                ? _jsx(DialogManager, {
                    addItem: uiState.historyManager.addItem,
                  })
                : _jsx(Composer, {}),
              uiState.dialogsVisible &&
                uiState.ctrlCPressedOnce &&
                _jsx(Box, {
                  marginTop: 1,
                  children: _jsx(Text, {
                    color: theme.status.warning,
                    children: 'Press Ctrl+C again to exit.',
                  }),
                }),
              uiState.dialogsVisible &&
                uiState.ctrlDPressedOnce &&
                _jsx(Box, {
                  marginTop: 1,
                  children: _jsx(Text, {
                    color: theme.status.warning,
                    children: 'Press Ctrl+D again to exit.',
                  }),
                }),
            ],
          }),
        ],
      }),
    }),
  });
};
//# sourceMappingURL=App.js.map
