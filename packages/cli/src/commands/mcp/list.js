/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { loadSettings } from '../../config/settings.js';
import { MCPServerStatus, createTransport } from '@google/gemini-cli-core';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { loadExtensions } from '../../config/extension.js';
/** ANSI color codes for status indicators */
const COLOR_GREEN = '\u001b[32m';
const COLOR_YELLOW = '\u001b[33m';
const COLOR_RED = '\u001b[31m';
const RESET_COLOR = '\u001b[0m';
/**
 * Retrieves all configured MCP servers from settings and extensions
 *
 * This function aggregates MCP server configurations from multiple sources:
 * - User and workspace settings
 * - Installed extensions with MCP server configurations
 *
 * Settings take precedence over extension configurations when servers
 * have the same name.
 *
 * @returns Promise resolving to a record of server names to configurations
 */
async function getMcpServersFromConfig() {
    const settings = loadSettings();
    const extensions = loadExtensions();
    const mcpServers = { ...(settings.merged.mcpServers || {}) };
    for (const extension of extensions) {
        Object.entries(extension.config.mcpServers || {}).forEach(([key, server]) => {
            if (mcpServers[key]) {
                return;
            }
            mcpServers[key] = {
                ...server,
                extensionName: extension.config.name,
            };
        });
    }
    return mcpServers;
}
/**
 * Tests connectivity to an MCP server
 *
 * This function performs an actual connection test to verify if an MCP server
 * is reachable and responding correctly. It creates a transport, establishes
 * a connection, and performs a ping operation to validate the server.
 *
 * @param serverName - Name of the server for identification
 * @param config - MCP server configuration including transport details
 * @returns Promise resolving to the server's connection status
 */
async function testMCPConnection(serverName, config) {
    const client = new Client({
        name: 'mcp-test-client',
        version: '0.0.1',
    });
    let transport;
    try {
        // Use the same transport creation logic as core
        transport = await createTransport(serverName, config, false);
    }
    catch (_error) {
        await client.close();
        return MCPServerStatus.DISCONNECTED;
    }
    try {
        // Attempt actual MCP connection with short timeout
        await client.connect(transport, { timeout: 5000 }); // 5s timeout
        // Test basic MCP protocol by pinging the server
        await client.ping();
        await client.close();
        return MCPServerStatus.CONNECTED;
    }
    catch (_error) {
        await transport.close();
        return MCPServerStatus.DISCONNECTED;
    }
}
/**
 * Gets the current status of an MCP server
 *
 * This is a wrapper function that delegates to the connection testing logic.
 * It provides a consistent interface for status checking while allowing for
 * future expansion of status determination logic.
 *
 * @param serverName - Name of the server to check
 * @param server - MCP server configuration
 * @returns Promise resolving to the server's current status
 */
async function getServerStatus(serverName, server) {
    // Test all server types by attempting actual connection
    return await testMCPConnection(serverName, server);
}
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
export async function listMcpServers() {
    const mcpServers = await getMcpServersFromConfig();
    const serverNames = Object.keys(mcpServers);
    if (serverNames.length === 0) {
        console.log('No MCP servers configured.');
        return;
    }
    console.log('Configured MCP servers:\n');
    for (const serverName of serverNames) {
        const server = mcpServers[serverName];
        const status = await getServerStatus(serverName, server);
        let statusIndicator = '';
        let statusText = '';
        switch (status) {
            case MCPServerStatus.CONNECTED:
                statusIndicator = COLOR_GREEN + '✓' + RESET_COLOR;
                statusText = 'Connected';
                break;
            case MCPServerStatus.CONNECTING:
                statusIndicator = COLOR_YELLOW + '…' + RESET_COLOR;
                statusText = 'Connecting';
                break;
            case MCPServerStatus.DISCONNECTED:
            default:
                statusIndicator = COLOR_RED + '✗' + RESET_COLOR;
                statusText = 'Disconnected';
                break;
        }
        let serverInfo = `${serverName}: `;
        if (server.httpUrl) {
            serverInfo += `${server.httpUrl} (http)`;
        }
        else if (server.url) {
            serverInfo += `${server.url} (sse)`;
        }
        else if (server.command) {
            serverInfo += `${server.command} ${server.args?.join(' ') || ''} (stdio)`;
        }
        console.log(`${statusIndicator} ${serverInfo} - ${statusText}`);
    }
}
/**
 * Yargs command module for listing MCP servers
 *
 * This command provides a comprehensive view of all configured MCP servers
 * across user settings, workspace settings, and extensions. It includes
 * real-time connectivity testing and color-coded status indicators for
 * quick assessment of server availability.
 */
export const listCommand = {
    command: 'list',
    describe: 'List all configured MCP servers',
    handler: async () => {
        await listMcpServers();
    },
};
//# sourceMappingURL=list.js.map