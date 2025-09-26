/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { GeminiCLIExtension } from '@google/gemini-cli-core';
import { ExtensionUpdateState } from '../state/extensions.js';
import type { UseHistoryManagerReturn } from './useHistoryManager.js';
export declare const useExtensionUpdates: (extensions: GeminiCLIExtension[], addItem: UseHistoryManagerReturn["addItem"], cwd: string) => {
    extensionsUpdateState: Map<string, ExtensionUpdateState>;
    setExtensionsUpdateState: import("react").Dispatch<import("react").SetStateAction<Map<string, ExtensionUpdateState>>>;
};
