/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { GeminiCLIExtension } from '@google/gemini-cli-core';
import { ExtensionUpdateState } from '../../ui/state/extensions.js';
import { type Dispatch, type SetStateAction } from 'react';
export interface ExtensionUpdateInfo {
    name: string;
    originalVersion: string;
    updatedVersion: string;
}
export declare function updateExtension(extension: GeminiCLIExtension, cwd: string | undefined, currentState: ExtensionUpdateState, setExtensionUpdateState: (updateState: ExtensionUpdateState) => void): Promise<ExtensionUpdateInfo | undefined>;
export declare function updateAllUpdatableExtensions(cwd: string | undefined, extensions: GeminiCLIExtension[], extensionsState: Map<string, ExtensionUpdateState>, setExtensionsUpdateState: Dispatch<SetStateAction<Map<string, ExtensionUpdateState>>>): Promise<ExtensionUpdateInfo[]>;
export interface ExtensionUpdateCheckResult {
    state: ExtensionUpdateState;
    error?: string;
}
export declare function checkForAllExtensionUpdates(extensions: GeminiCLIExtension[], extensionsUpdateState: Map<string, ExtensionUpdateState>, setExtensionsUpdateState: Dispatch<SetStateAction<Map<string, ExtensionUpdateState>>>, cwd?: string): Promise<Map<string, ExtensionUpdateState>>;
