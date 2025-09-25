/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Config } from '@google/gemini-cli-core';
import type { Settings } from './settings.js';
import type { Extension } from './extension.js';
import { type AgentSettings } from '../types.js';
/**
 * Loads and initializes a complete configuration for agent execution.
 *
 * This function assembles a comprehensive configuration from multiple sources:
 * - User settings from gemini.config.json
 * - Extension configurations and context files
 * - Environment variables for authentication and debugging
 * - Workspace-specific memory and file discovery
 *
 * The configuration includes LLM model settings, MCP server connections,
 * telemetry options, and security settings. Authentication is automatically
 * configured based on available credentials (CCPA or API key).
 *
 * @param settings - User-defined settings from configuration files
 * @param extensions - Array of extensions providing additional functionality
 * @param taskId - Unique session identifier for this execution context
 * @returns Promise resolving to the initialized Config instance
 * @throws {Error} When authentication cannot be established
 *
 * @example
 * ```typescript
 * const settings = loadSettings(workspaceRoot);
 * const extensions = loadExtensions(workspaceRoot);
 * const config = await loadConfig(settings, extensions, 'task-123');
 * ```
 */
export declare function loadConfig(settings: Settings, extensions: Extension[], taskId: string): Promise<Config>;
/**
 * Merges MCP (Model Context Protocol) server configurations from settings and extensions.
 *
 * This function combines MCP server definitions from user settings with those provided
 * by extensions, ensuring no conflicts occur. If a server key exists in both sources,
 * the user settings take precedence and a warning is logged.
 *
 * @param settings - User settings containing MCP server configurations
 * @param extensions - Extension configurations that may include additional MCP servers
 * @returns Merged MCP server configuration object
 *
 * @example
 * ```typescript
 * const mcpServers = mergeMcpServers(userSettings, loadedExtensions);
 * // Result: { 'server1': config1, 'server2': config2, ... }
 * ```
 */
export declare function mergeMcpServers(settings: Settings, extensions: Extension[]): {
    [x: string]: import("@google/gemini-cli-core").MCPServerConfig;
};
/**
 * Sets and changes to the target workspace directory for agent execution.
 *
 * This function determines the appropriate working directory based on agent settings
 * or environment variables, then changes the process's current working directory.
 * It provides a fallback to the original directory if the target cannot be resolved.
 *
 * @param agentSettings - Optional agent settings containing workspace path information
 * @returns The resolved absolute path of the target directory
 *
 * @example
 * ```typescript
 * const targetDir = setTargetDir(agentSettings);
 * // Process is now operating in the target directory
 * ```
 */
export declare function setTargetDir(agentSettings: AgentSettings | undefined): string;
/**
 * Loads environment variables from .env files in the workspace hierarchy.
 *
 * This function searches for .env files starting from the current working directory
 * and moving up the directory tree. It prioritizes Gemini-specific .env files
 * located in .gemini directories over standard .env files.
 *
 * The search order is:
 * 1. .gemini/.env in current or parent directories
 * 2. .env in current or parent directories
 * 3. .gemini/.env in home directory
 * 4. .env in home directory
 *
 * @example
 * ```typescript
 * loadEnvironment();
 * // Environment variables from .env files are now available in process.env
 * ```
 */
export declare function loadEnvironment(): void;
