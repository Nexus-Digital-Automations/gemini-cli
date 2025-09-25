/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { loadSettings, SettingScope } from '../../config/settings.js';
/**
 * Removes an MCP (Model Context Protocol) server configuration
 *
 * This function handles the removal of MCP server configurations from
 * either user or project scope settings. It provides safe deletion with
 * validation to ensure the server exists before attempting removal.
 *
 * @param name - Unique identifier of the MCP server to remove
 * @param options - Configuration options for the removal operation
 * @param options.scope - Configuration scope ('user' or 'project')
 *
 * @example
 * ```typescript
 * // Remove server from project scope
 * await removeMcpServer('my-server', { scope: 'project' });
 *
 * // Remove server from user scope
 * await removeMcpServer('global-server', { scope: 'user' });
 * ```
 */
async function removeMcpServer(name, options) {
  const { scope } = options;
  const settingsScope =
    scope === 'user' ? SettingScope.User : SettingScope.Workspace;
  const settings = loadSettings();
  const existingSettings = settings.forScope(settingsScope).settings;
  const mcpServers = existingSettings.mcpServers || {};
  if (!mcpServers[name]) {
    console.log(`Server "${name}" not found in ${scope} settings.`);
    return;
  }
  delete mcpServers[name];
  settings.setValue(settingsScope, 'mcpServers', mcpServers);
  console.log(`Server "${name}" removed from ${scope} settings.`);
}
/**
 * Yargs command module for removing MCP servers
 *
 * This command provides a safe interface for removing MCP server configurations
 * from either user or project scope. It includes validation to ensure the server
 * exists before attempting removal and provides clear feedback about the operation.
 */
export const removeCommand = {
  command: 'remove <name>',
  describe: 'Remove a server',
  builder: (yargs) =>
    yargs
      .usage('Usage: gemini mcp remove [options] <name>')
      .positional('name', {
        describe: 'Name of the server',
        type: 'string',
        demandOption: true,
      })
      .option('scope', {
        alias: 's',
        describe: 'Configuration scope (user or project)',
        type: 'string',
        default: 'project',
        choices: ['user', 'project'],
      }),
  handler: async (argv) => {
    await removeMcpServer(argv['name'], {
      scope: argv['scope'],
    });
  },
};
//# sourceMappingURL=remove.js.map
