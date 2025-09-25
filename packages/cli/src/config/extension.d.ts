/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { MCPServerConfig, GeminiCLIExtension, ExtensionInstallMetadata } from '@google/gemini-cli-core';
import { SettingScope } from '../config/settings.js';
import type { LoadExtensionContext } from './extensions/variableSchema.js';
export declare const EXTENSIONS_DIRECTORY_NAME: string;
export declare const EXTENSIONS_CONFIG_FILENAME = "gemini-extension.json";
export declare const INSTALL_METADATA_FILENAME = ".gemini-extension-install.json";
export interface Extension {
    path: string;
    config: ExtensionConfig;
    contextFiles: string[];
    installMetadata?: ExtensionInstallMetadata | undefined;
}
export interface ExtensionConfig {
    name: string;
    version: string;
    mcpServers?: Record<string, MCPServerConfig>;
    contextFileName?: string | string[];
    excludeTools?: string[];
}
export interface ExtensionUpdateInfo {
    name: string;
    originalVersion: string;
    updatedVersion: string;
}
export declare class ExtensionStorage {
    private readonly extensionName;
    constructor(extensionName: string);
    getExtensionDir(): string;
    getConfigPath(): string;
    static getUserExtensionsDir(): string;
    static createTmpDir(): Promise<string>;
}
export declare function getWorkspaceExtensions(workspaceDir: string): Extension[];
export declare function copyExtension(source: string, destination: string): Promise<void>;
export declare function performWorkspaceExtensionMigration(extensions: Extension[]): Promise<string[]>;
export declare function loadExtensions(workspaceDir?: string): Extension[];
export declare function loadUserExtensions(): Extension[];
export declare function loadExtensionsFromDir(dir: string): Extension[];
export declare function loadExtension(context: LoadExtensionContext): Extension | null;
export declare function loadInstallMetadata(extensionDir: string): ExtensionInstallMetadata | undefined;
/**
 * Returns an annotated list of extensions. If an extension is listed in enabledExtensionNames, it will be active.
 * If enabledExtensionNames is empty, an extension is active unless it is disabled.
 * @param extensions The base list of extensions.
 * @param enabledExtensionNames The names of explicitly enabled extensions.
 * @param workspaceDir The current workspace directory.
 */
export declare function annotateActiveExtensions(extensions: Extension[], enabledExtensionNames: string[], workspaceDir: string): GeminiCLIExtension[];
export declare function installExtension(installMetadata: ExtensionInstallMetadata, askConsent?: boolean, cwd?: string): Promise<string>;
export declare function loadExtensionConfig(context: LoadExtensionContext): ExtensionConfig;
export declare function uninstallExtension(extensionIdentifier: string, cwd?: string): Promise<void>;
export declare function toOutputString(extension: Extension): string;
export declare function disableExtension(name: string, scope: SettingScope, cwd?: string): void;
export declare function enableExtension(name: string, scope: SettingScope, cwd?: string): void;
