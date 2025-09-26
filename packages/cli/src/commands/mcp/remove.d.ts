/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
/**
 * Yargs command module for removing MCP servers
 *
 * This command provides a safe interface for removing MCP server configurations
 * from either user or project scope. It includes validation to ensure the server
 * exists before attempting removal and provides clear feedback about the operation.
 */
export declare const removeCommand: CommandModule;
