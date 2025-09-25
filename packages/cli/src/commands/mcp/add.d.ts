/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';
/**
 * Yargs command module for adding MCP servers
 *
 * This command provides a comprehensive interface for configuring MCP servers
 * with support for multiple transport protocols, security settings, and tool
 * filtering. It handles both creation of new servers and updating existing ones.
 *
 * Supported features:
 * - Multiple transport protocols (stdio, Server-Sent Events, HTTP)
 * - Flexible argument passing with -- separator support
 * - Environment variable and HTTP header configuration
 * - Tool inclusion/exclusion filtering
 * - User and project scope management
 * - Security settings including trust levels and timeouts
 */
export declare const addCommand: CommandModule;
