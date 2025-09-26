/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import type { LoadedSettings , SettingScope } from '../../config/settings.js';
interface SettingsDialogProps {
    settings: LoadedSettings;
    onSelect: (settingName: string | undefined, scope: SettingScope) => void;
    onRestartRequest?: () => void;
    availableTerminalHeight?: number;
}
export declare function SettingsDialog({ settings, onSelect, onRestartRequest, availableTerminalHeight, }: SettingsDialogProps): React.JSX.Element;
export {};
