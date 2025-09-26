/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
/**
 * Lists all configured MCP servers with their connection status
 *
 * This function provides a comprehensive overview of all MCP servers including:
 * - Server names and configuration details
 * - Real-time connection status with color-coded indicators
 * - Transport type information (stdio, sse, http)
 * - Command/URL details for each server
 *
 * The function aggregates servers from both settings and extensions,
 * performs connectivity tests, and displays formatted output with
 * visual status indicators.
 *
 * @example
 * ```
 * ✓ my-server: /path/to/server --arg (stdio) - Connected
 * ✗ api-server: https://api.example.com (sse) - Disconnected
 * ```
 */
export declare function listMcpServers(): Promise<void>;
/**
 * Yargs command module for listing MCP servers
 *
 * This command provides a comprehensive view of all configured MCP servers
 * across user settings, workspace settings, and extensions. It includes
 * real-time connectivity testing and color-coded status indicators for
 * quick assessment of server availability.
 */
export declare const listCommand: CommandModule;
