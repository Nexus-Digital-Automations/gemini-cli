/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { homedir } from 'node:os';
import * as dotenv from 'dotenv';

import type { TelemetryTarget } from '@google/gemini-cli-core';
import {
  AuthType,
  Config,
  type ConfigParameters,
  FileDiscoveryService,
  ApprovalMode,
  loadServerHierarchicalMemory,
  GEMINI_CONFIG_DIR,
  DEFAULT_GEMINI_EMBEDDING_MODEL,
  DEFAULT_GEMINI_MODEL,
} from '@google/gemini-cli-core';

import { logger } from '../utils/logger.js';
import type { Settings } from './settings.js';
import type { Extension } from './extension.js';
import { type AgentSettings, CoderAgentEvent } from '../types.js';

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
export async function loadConfig(
  settings: Settings,
  extensions: Extension[],
  taskId: string,
): Promise<Config> {
  const mcpServers = mergeMcpServers(settings, extensions);
  const workspaceDir = process.cwd();
  const adcFilePath = process.env['GOOGLE_APPLICATION_CREDENTIALS'];

  const configParams: ConfigParameters = {
    sessionId: taskId,
    model: DEFAULT_GEMINI_MODEL,
    embeddingModel: DEFAULT_GEMINI_EMBEDDING_MODEL,
    sandbox: undefined, // Sandbox might not be relevant for a server-side agent
    targetDir: workspaceDir, // Or a specific directory the agent operates on
    debugMode: process.env['DEBUG'] === 'true' || false,
    question: '', // Not used in server mode directly like CLI
    fullContext: false, // Server might have different context needs
    coreTools: settings.coreTools || undefined,
    excludeTools: settings.excludeTools || undefined,
    showMemoryUsage: settings.showMemoryUsage || false,
    approvalMode:
      process.env['GEMINI_YOLO_MODE'] === 'true'
        ? ApprovalMode.YOLO
        : ApprovalMode.DEFAULT,
    mcpServers,
    cwd: workspaceDir,
    telemetry: {
      enabled: settings.telemetry?.enabled,
      target: settings.telemetry?.target as TelemetryTarget,
      otlpEndpoint:
        process.env['OTEL_EXPORTER_OTLP_ENDPOINT'] ??
        settings.telemetry?.otlpEndpoint,
      logPrompts: settings.telemetry?.logPrompts,
    },
    // Git-aware file filtering settings
    fileFiltering: {
      respectGitIgnore: settings.fileFiltering?.respectGitIgnore,
      enableRecursiveFileSearch:
        settings.fileFiltering?.enableRecursiveFileSearch,
    },
    ideMode: false,
    folderTrust: settings.folderTrust === true,
  };

  const fileService = new FileDiscoveryService(workspaceDir);
  const extensionContextFilePaths = extensions.flatMap((e) => e.contextFiles);
  const { memoryContent, fileCount } = await loadServerHierarchicalMemory(
    workspaceDir,
    [workspaceDir],
    false,
    fileService,
    extensionContextFilePaths,
    settings.folderTrust === true,
  );
  configParams.userMemory = memoryContent;
  configParams.geminiMdFileCount = fileCount;
  const config = new Config({
    ...configParams,
  });
  // Needed to initialize ToolRegistry, and git checkpointing if enabled
  await config.initialize();

  if (process.env['USE_CCPA']) {
    logger.info('[Config] Using CCPA Auth:');
    try {
      if (adcFilePath) {
        path.resolve(adcFilePath);
      }
    } catch (e) {
      logger.error(
        `[Config] USE_CCPA env var is true but unable to resolve GOOGLE_APPLICATION_CREDENTIALS file path ${adcFilePath}. Error ${e}`,
      );
    }
    await config.refreshAuth(AuthType.LOGIN_WITH_GOOGLE);
    logger.info(
      `[Config] GOOGLE_CLOUD_PROJECT: ${process.env['GOOGLE_CLOUD_PROJECT']}`,
    );
  } else if (process.env['GEMINI_API_KEY']) {
    logger.info('[Config] Using Gemini API Key');
    await config.refreshAuth(AuthType.USE_GEMINI);
  } else {
    const errorMessage =
      '[Config] Unable to set GeneratorConfig. Please provide a GEMINI_API_KEY or set USE_CCPA.';
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  return config;
}

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
export function mergeMcpServers(settings: Settings, extensions: Extension[]) {
  const mcpServers = { ...(settings.mcpServers || {}) };
  for (const extension of extensions) {
    Object.entries(extension.config.mcpServers || {}).forEach(
      ([key, server]) => {
        if (mcpServers[key]) {
          console.warn(
            `Skipping extension MCP config for server with key "${key}" as it already exists.`,
          );
          return;
        }
        mcpServers[key] = server;
      },
    );
  }
  return mcpServers;
}

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
export function setTargetDir(agentSettings: AgentSettings | undefined): string {
  const originalCWD = process.cwd();
  const targetDir =
    process.env['CODER_AGENT_WORKSPACE_PATH'] ??
    (agentSettings?.kind === CoderAgentEvent.StateAgentSettingsEvent
      ? agentSettings.workspacePath
      : undefined);

  if (!targetDir) {
    return originalCWD;
  }

  logger.info(
    `[CoderAgentExecutor] Overriding workspace path to: ${targetDir}`,
  );

  try {
    const resolvedPath = path.resolve(targetDir);
    process.chdir(resolvedPath);
    return resolvedPath;
  } catch (e) {
    logger.error(
      `[CoderAgentExecutor] Error resolving workspace path: ${e}, returning original os.cwd()`,
    );
    return originalCWD;
  }
}

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
export function loadEnvironment(): void {
  const envFilePath = findEnvFile(process.cwd());
  if (envFilePath) {
    dotenv.config({ path: envFilePath, override: true });
  }
}

/**
 * Searches for .env files in the directory hierarchy.
 *
 * This function implements a hierarchical search strategy for environment files,
 * prioritizing Gemini-specific configurations over generic ones.
 *
 * @param startDir - The directory to start searching from
 * @returns The path to the first .env file found, or null if none exists
 * @private
 */
function findEnvFile(startDir: string): string | null {
  let currentDir = path.resolve(startDir);
  while (true) {
    // prefer gemini-specific .env under GEMINI_DIR
    const geminiEnvPath = path.join(currentDir, GEMINI_CONFIG_DIR, '.env');
    if (fs.existsSync(geminiEnvPath)) {
      return geminiEnvPath;
    }
    const envPath = path.join(currentDir, '.env');
    if (fs.existsSync(envPath)) {
      return envPath;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir || !parentDir) {
      // check .env under home as fallback, again preferring gemini-specific .env
      const homeGeminiEnvPath = path.join(
        process.cwd(),
        GEMINI_CONFIG_DIR,
        '.env',
      );
      if (fs.existsSync(homeGeminiEnvPath)) {
        return homeGeminiEnvPath;
      }
      const homeEnvPath = path.join(homedir(), '.env');
      if (fs.existsSync(homeEnvPath)) {
        return homeEnvPath;
      }
      return null;
    }
    currentDir = parentDir;
  }
}
