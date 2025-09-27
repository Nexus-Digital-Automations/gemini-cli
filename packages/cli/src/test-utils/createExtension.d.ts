/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  type MCPServerConfig,
  type ExtensionInstallMetadata,
} from '@google/gemini-cli-core';
export declare function createExtension({
  extensionsDir,
  name,
  version,
  addContextFile,
  contextFileName,
  mcpServers,
  installMetadata,
}?: {
  extensionsDir?: string;
  name?: string;
  version?: string;
  addContextFile?: boolean;
  contextFileName?: string;
  mcpServers?: Record<string, MCPServerConfig>;
  installMetadata?: ExtensionInstallMetadata;
}): string;
