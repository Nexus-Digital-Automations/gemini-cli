/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as path from 'node:path';
import process from 'node:process';
import {
  AuthType,
  createContentGenerator,
  createContentGeneratorConfig,
} from '../core/contentGenerator.js';
import { PromptRegistry } from '../prompts/prompt-registry.js';
import { ToolRegistry } from '../tools/tool-registry.js';
import { LSTool } from '../tools/ls.js';
import { ReadFileTool } from '../tools/read-file.js';
import { GrepTool } from '../tools/grep.js';
import { canUseRipgrep, RipGrepTool } from '../tools/ripGrep.js';
import { GlobTool } from '../tools/glob.js';
import { EditTool } from '../tools/edit.js';
import { SmartEditTool } from '../tools/smart-edit.js';
import { ShellTool } from '../tools/shell.js';
import { WriteFileTool } from '../tools/write-file.js';
import { WebFetchTool } from '../tools/web-fetch.js';
import { ReadManyFilesTool } from '../tools/read-many-files.js';
import { MemoryTool, setGeminiMdFilename } from '../tools/memoryTool.js';
import { WebSearchTool } from '../tools/web-search.js';
import { GeminiClient } from '../core/client.js';
import { BaseLlmClient } from '../core/baseLlmClient.js';
import { FileDiscoveryService } from '../services/fileDiscoveryService.js';
import { GitService } from '../services/gitService.js';
import {
  initializeTelemetry,
  DEFAULT_TELEMETRY_TARGET,
  DEFAULT_OTLP_ENDPOINT,
  uiTelemetryService,
} from '../telemetry/index.js';
import { tokenLimit } from '../core/tokenLimits.js';
import { StartSessionEvent } from '../telemetry/index.js';
import {
  DEFAULT_GEMINI_EMBEDDING_MODEL,
  DEFAULT_GEMINI_FLASH_MODEL,
} from './models.js';
import { shouldAttemptBrowserLaunch } from '../utils/browser.js';
import { ideContextStore } from '../ide/ideContext.js';
import { WriteTodosTool } from '../tools/write-todos.js';
import { StandardFileSystemService } from '../services/fileSystemService.js';
import {
  logCliConfiguration,
  logRipgrepFallback,
} from '../telemetry/loggers.js';
import { RipgrepFallbackEvent } from '../telemetry/types.js';
import { ModelRouterService } from '../routing/modelRouterService.js';
import { OutputFormat } from '../output/types.js';
import { WorkspaceContext } from '../utils/workspaceContext.js';
import { Storage } from './storage.js';
import { FileExclusions } from '../utils/ignorePatterns.js';
import { MessageBus } from '../confirmation-bus/message-bus.js';
import { PolicyEngine } from '../policy/policy-engine.js';
import { ProxyAgent, setGlobalDispatcher } from 'undici';
/**
 * Tool execution approval modes that control how the application handles tool calls.
 * Determines the level of user interaction required before executing potentially dangerous operations.
 *
 * Security Note: Higher automation modes should only be used in trusted environments.
 */
export var ApprovalMode;
(function (ApprovalMode) {
  /** Default mode requiring user approval for each tool call */
  ApprovalMode['DEFAULT'] = 'default';
  /** Automatically approve edit operations but require approval for other tools */
  ApprovalMode['AUTO_EDIT'] = 'autoEdit';
  /** Automatically approve all tool calls without user confirmation (use with caution) */
  ApprovalMode['YOLO'] = 'yolo';
})(ApprovalMode || (ApprovalMode = {}));
/** Default file filtering options for memory/context files (more permissive for documentation) */
export const DEFAULT_MEMORY_FILE_FILTERING_OPTIONS = {
  respectGitIgnore: false,
  respectGeminiIgnore: true,
};
/** Default file filtering options for general file operations (respects both ignore files) */
export const DEFAULT_FILE_FILTERING_OPTIONS = {
  respectGitIgnore: true,
  respectGeminiIgnore: true,
};
/** Default character threshold for truncating tool output to manage context window usage */
export const DEFAULT_TRUNCATE_TOOL_OUTPUT_THRESHOLD = 4_000_000;
/** Default number of lines to preserve when truncating tool output */
export const DEFAULT_TRUNCATE_TOOL_OUTPUT_LINES = 1000;
/**
 * Configuration for Model Context Protocol (MCP) server connections.
 * Supports multiple transport methods (stdio, HTTP, WebSocket) and authentication.
 *
 * @example
 * ```typescript
 * // stdio transport
 * const stdioServer = new MCPServerConfig(
 *   'node',
 *   ['./mcp-server.js'],
 *   { NODE_ENV: 'production' },
 *   '/path/to/server'
 * );
 *
 * // HTTP transport
 * const httpServer = new MCPServerConfig(
 *   undefined, undefined, undefined, undefined,
 *   undefined,
 *   'https://api.example.com/mcp',
 *   { 'Authorization': 'Bearer token' }
 * );
 * ```
 */
export class MCPServerConfig {
  command;
  args;
  env;
  cwd;
  url;
  httpUrl;
  headers;
  tcp;
  timeout;
  trust;
  description;
  includeTools;
  excludeTools;
  extensionName;
  oauth;
  authProviderType;
  constructor(
    // For stdio transport
    /** Command to execute for stdio-based MCP servers */
    command,
    /** Command line arguments for the MCP server process */
    args,
    /** Environment variables to set for the MCP server process */
    env,
    /** Working directory for the MCP server process */
    cwd,
    // For sse transport
    /** URL for server-sent events transport */
    url,
    // For streamable http transport
    /** URL for HTTP-based MCP communication */
    httpUrl,
    /** HTTP headers to include in requests */
    headers,
    // For websocket transport
    /** TCP address for WebSocket transport */
    tcp,
    // Common
    /** Connection timeout in milliseconds */
    timeout,
    /** Whether this MCP server is trusted for automatic execution */
    trust,
    // Metadata
    /** Human-readable description of the MCP server's purpose */
    description,
    /** Specific tools to include from this server (whitelist) */
    includeTools,
    /** Specific tools to exclude from this server (blacklist) */
    excludeTools,
    /** Name of the extension that provides this MCP server */
    extensionName,
    // OAuth configuration
    /** OAuth configuration for authenticated MCP servers */
    oauth,
    /** Type of authentication provider to use */
    authProviderType,
  ) {
    this.command = command;
    this.args = args;
    this.env = env;
    this.cwd = cwd;
    this.url = url;
    this.httpUrl = httpUrl;
    this.headers = headers;
    this.tcp = tcp;
    this.timeout = timeout;
    this.trust = trust;
    this.description = description;
    this.includeTools = includeTools;
    this.excludeTools = excludeTools;
    this.extensionName = extensionName;
    this.oauth = oauth;
    this.authProviderType = authProviderType;
  }
}
/**
 * Types of authentication providers supported for MCP server connections.
 * Determines how authentication credentials are obtained and managed.
 */
export var AuthProviderType;
(function (AuthProviderType) {
  /** Dynamically discover authentication method through server negotiation */
  AuthProviderType['DYNAMIC_DISCOVERY'] = 'dynamic_discovery';
  /** Use Google Cloud credentials for authentication */
  AuthProviderType['GOOGLE_CREDENTIALS'] = 'google_credentials';
})(AuthProviderType || (AuthProviderType = {}));
/**
 * Central configuration manager for the Gemini CLI application.
 * Coordinates all application settings, services, and runtime configuration.
 *
 * This class serves as the main configuration hub, managing:
 * - Tool registry and discovery
 * - Model and content generation configuration
 * - File system and workspace context
 * - Authentication and security settings
 * - Telemetry and debugging options
 * - Extension and MCP server management
 *
 * The Config class follows a two-phase initialization pattern:
 * 1. Constructor: Sets up basic configuration from parameters
 * 2. initialize(): Performs async setup of services and registries
 *
 * @example
 * ```typescript
 * const config = new Config({
 *   sessionId: 'session-123',
 *   targetDir: '/workspace',
 *   debugMode: false,
 *   model: 'gemini-1.5-flash',
 *   cwd: process.cwd()
 * });
 *
 * await config.initialize();
 *
 * // Access configured services
 * const toolRegistry = config.getToolRegistry();
 * const contentGenerator = config.getContentGenerator();
 * ```
 */
export class Config {
  toolRegistry;
  promptRegistry;
  sessionId;
  fileSystemService;
  contentGeneratorConfig;
  contentGenerator;
  embeddingModel;
  sandbox;
  targetDir;
  workspaceContext;
  debugMode;
  question;
  fullContext;
  coreTools;
  allowedTools;
  excludeTools;
  toolDiscoveryCommand;
  toolCallCommand;
  mcpServerCommand;
  mcpServers;
  userMemory;
  geminiMdFileCount;
  approvalMode;
  showMemoryUsage;
  accessibility;
  telemetrySettings;
  usageStatisticsEnabled;
  geminiClient;
  baseLlmClient;
  modelRouterService;
  fileFiltering;
  fileDiscoveryService = null;
  gitService = undefined;
  checkpointing;
  proxy;
  cwd;
  bugCommand;
  model;
  extensionContextFilePaths;
  noBrowser;
  folderTrustFeature;
  folderTrust;
  ideMode;
  inFallbackMode = false;
  maxSessionTurns;
  listExtensions;
  _extensions;
  _blockedMcpServers;
  fallbackModelHandler;
  quotaErrorOccurred = false;
  summarizeToolOutput;
  experimentalZedIntegration = false;
  loadMemoryFromIncludeDirectories = false;
  chatCompression;
  interactive;
  trustedFolder;
  useRipgrep;
  shouldUseNodePtyShell;
  skipNextSpeakerCheck;
  shellExecutionConfig;
  extensionManagement = true;
  enablePromptCompletion = false;
  truncateToolOutputThreshold;
  truncateToolOutputLines;
  enableToolOutputTruncation;
  initialized = false;
  storage;
  fileExclusions;
  eventEmitter;
  useSmartEdit;
  useWriteTodos;
  messageBus;
  policyEngine;
  outputSettings;
  useModelRouter;
  enableMessageBusIntegration;
  /**
   * Creates a new Config instance with the provided parameters.
   * Performs synchronous initialization of configuration properties.
   * Call initialize() after construction for async setup.
   *
   * @param params - Complete configuration parameters
   */
  constructor(params) {
    this.sessionId = params.sessionId;
    this.embeddingModel =
      params.embeddingModel ?? DEFAULT_GEMINI_EMBEDDING_MODEL;
    this.fileSystemService = new StandardFileSystemService();
    this.sandbox = params.sandbox;
    this.targetDir = path.resolve(params.targetDir);
    this.workspaceContext = new WorkspaceContext(
      this.targetDir,
      params.includeDirectories ?? [],
    );
    this.debugMode = params.debugMode;
    this.question = params.question;
    this.fullContext = params.fullContext ?? false;
    this.coreTools = params.coreTools;
    this.allowedTools = params.allowedTools;
    this.excludeTools = params.excludeTools;
    this.toolDiscoveryCommand = params.toolDiscoveryCommand;
    this.toolCallCommand = params.toolCallCommand;
    this.mcpServerCommand = params.mcpServerCommand;
    this.mcpServers = params.mcpServers;
    this.userMemory = params.userMemory ?? '';
    this.geminiMdFileCount = params.geminiMdFileCount ?? 0;
    this.approvalMode = params.approvalMode ?? ApprovalMode.DEFAULT;
    this.showMemoryUsage = params.showMemoryUsage ?? false;
    this.accessibility = params.accessibility ?? {};
    this.telemetrySettings = {
      enabled: params.telemetry?.enabled ?? false,
      target: params.telemetry?.target ?? DEFAULT_TELEMETRY_TARGET,
      otlpEndpoint: params.telemetry?.otlpEndpoint ?? DEFAULT_OTLP_ENDPOINT,
      otlpProtocol: params.telemetry?.otlpProtocol,
      logPrompts: params.telemetry?.logPrompts ?? true,
      outfile: params.telemetry?.outfile,
      useCollector: params.telemetry?.useCollector,
    };
    this.usageStatisticsEnabled = params.usageStatisticsEnabled ?? true;
    this.fileFiltering = {
      respectGitIgnore: params.fileFiltering?.respectGitIgnore ?? true,
      respectGeminiIgnore: params.fileFiltering?.respectGeminiIgnore ?? true,
      enableRecursiveFileSearch:
        params.fileFiltering?.enableRecursiveFileSearch ?? true,
      disableFuzzySearch: params.fileFiltering?.disableFuzzySearch ?? false,
    };
    this.checkpointing = params.checkpointing ?? false;
    this.proxy = params.proxy;
    this.cwd = params.cwd ?? process.cwd();
    this.fileDiscoveryService = params.fileDiscoveryService ?? null;
    this.bugCommand = params.bugCommand;
    this.model = params.model;
    this.extensionContextFilePaths = params.extensionContextFilePaths ?? [];
    this.maxSessionTurns = params.maxSessionTurns ?? -1;
    this.experimentalZedIntegration =
      params.experimentalZedIntegration ?? false;
    this.listExtensions = params.listExtensions ?? false;
    this._extensions = params.extensions ?? [];
    this._blockedMcpServers = params.blockedMcpServers ?? [];
    this.noBrowser = params.noBrowser ?? false;
    this.summarizeToolOutput = params.summarizeToolOutput;
    this.folderTrustFeature = params.folderTrustFeature ?? false;
    this.folderTrust = params.folderTrust ?? false;
    this.ideMode = params.ideMode ?? false;
    this.loadMemoryFromIncludeDirectories =
      params.loadMemoryFromIncludeDirectories ?? false;
    this.chatCompression = params.chatCompression;
    this.interactive = params.interactive ?? false;
    this.trustedFolder = params.trustedFolder;
    this.useRipgrep = params.useRipgrep ?? true;
    this.shouldUseNodePtyShell = params.shouldUseNodePtyShell ?? false;
    this.skipNextSpeakerCheck = params.skipNextSpeakerCheck ?? true;
    this.shellExecutionConfig = {
      terminalWidth: params.shellExecutionConfig?.terminalWidth ?? 80,
      terminalHeight: params.shellExecutionConfig?.terminalHeight ?? 24,
      showColor: params.shellExecutionConfig?.showColor ?? false,
      pager: params.shellExecutionConfig?.pager ?? 'cat',
    };
    this.truncateToolOutputThreshold =
      params.truncateToolOutputThreshold ??
      DEFAULT_TRUNCATE_TOOL_OUTPUT_THRESHOLD;
    this.truncateToolOutputLines =
      params.truncateToolOutputLines ?? DEFAULT_TRUNCATE_TOOL_OUTPUT_LINES;
    this.enableToolOutputTruncation =
      params.enableToolOutputTruncation ?? false;
    this.useSmartEdit = params.useSmartEdit ?? true;
    this.useWriteTodos = params.useWriteTodos ?? false;
    this.useModelRouter = params.useModelRouter ?? false;
    this.enableMessageBusIntegration =
      params.enableMessageBusIntegration ?? false;
    this.extensionManagement = params.extensionManagement ?? true;
    this.storage = new Storage(this.targetDir);
    this.enablePromptCompletion = params.enablePromptCompletion ?? false;
    this.fileExclusions = new FileExclusions(this);
    this.eventEmitter = params.eventEmitter;
    this.policyEngine = new PolicyEngine(params.policyEngineConfig);
    this.messageBus = new MessageBus(this.policyEngine);
    this.outputSettings = {
      format: params.output?.format ?? OutputFormat.TEXT,
    };
    if (params.contextFileName) {
      setGeminiMdFilename(params.contextFileName);
    }
    if (this.telemetrySettings.enabled) {
      initializeTelemetry(this);
    }
    if (this.getProxy()) {
      setGlobalDispatcher(new ProxyAgent(this.getProxy()));
    }
    this.geminiClient = new GeminiClient(this);
    this.modelRouterService = new ModelRouterService(this);
  }
  /**
   * Performs asynchronous initialization of services and registries.
   * Must be called exactly once after construction and before using the config.
   *
   * Initialization steps (optimized for parallel execution):
   * 1. Sets up file discovery service with async ignore file loading
   * 2. Initializes Git service if checkpointing is enabled (parallel with file service)
   * 3. Creates prompt and tool registries (parallel where possible)
   * 4. Initializes the Gemini client (parallel with tool registry)
   *
   * @throws Error if called more than once
   *
   * @example
   * ```typescript
   * const config = new Config(params);
   * await config.initialize(); // Required before use
   * ```
   */
  async initialize() {
    if (this.initialized) {
      throw Error('Config was already initialized');
    }
    this.initialized = true;
    // Import logger for performance tracking
    const { getComponentLogger, createTimer, LogLevel } = await import(
      '../utils/logger.js'
    );
    const logger = getComponentLogger('Config', { sessionId: this.sessionId });
    const endTimer = createTimer(logger, 'initialize', LogLevel.INFO);
    try {
      // Phase 1: Initialize services that can run in parallel
      const phase1Promises = [];
      // Initialize FileDiscoveryService with async ignore file loading
      const fileService = this.getFileService();
      phase1Promises.push(fileService.initialize());
      // Initialize Git service if checkpointing is enabled (parallel with file service)
      if (this.getCheckpointingEnabled()) {
        phase1Promises.push(this.getGitService().then(() => {}));
      }
      // Wait for Phase 1 completion
      await Promise.all(phase1Promises);
      logger.debug('Phase 1 initialization completed', {
        fileServiceInitialized: true,
        gitServiceInitialized: this.getCheckpointingEnabled(),
      });
      // Phase 2: Initialize registries and client (some can run in parallel)
      const phase2Promises = [];
      // Initialize prompt registry (lightweight, synchronous)
      this.promptRegistry = new PromptRegistry();
      // Initialize tool registry (can be resource intensive)
      await this.createToolRegistry().then((registry) => {
        this.toolRegistry = registry;
      });
      // Initialize Gemini client (can run in parallel with tool registry)
      phase2Promises.push(this.geminiClient.initialize());
      // Wait for Phase 2 completion
      await Promise.all(phase2Promises);
      logger.info('Config initialization completed successfully', {
        sessionId: this.sessionId,
        toolCount: this.toolRegistry.getAllToolNames().length,
      });
    } catch (error) {
      logger.error('Config initialization failed', { error });
      throw error;
    } finally {
      endTimer();
    }
  }
  getContentGenerator() {
    return this.contentGenerator;
  }
  async refreshAuth(authMethod) {
    // Vertex and Genai have incompatible encryption and sending history with
    // throughtSignature from Genai to Vertex will fail, we need to strip them
    if (
      this.contentGeneratorConfig?.authType === AuthType.USE_GEMINI &&
      authMethod === AuthType.LOGIN_WITH_GOOGLE
    ) {
      // Restore the conversation history to the new client
      this.geminiClient.stripThoughtsFromHistory();
    }
    const newContentGeneratorConfig = createContentGeneratorConfig(
      this,
      authMethod,
    );
    this.contentGenerator = await createContentGenerator(
      newContentGeneratorConfig,
      this,
      this.getSessionId(),
    );
    // Only assign to instance properties after successful initialization
    this.contentGeneratorConfig = newContentGeneratorConfig;
    // Initialize BaseLlmClient now that the ContentGenerator is available
    this.baseLlmClient = new BaseLlmClient(this.contentGenerator, this);
    // Reset the session flag since we're explicitly changing auth and using default model
    this.inFallbackMode = false;
    // Logging the cli configuration here as the auth related configuration params would have been loaded by this point
    logCliConfiguration(this, new StartSessionEvent(this, this.toolRegistry));
  }
  getUserTier() {
    return this.contentGenerator?.userTier;
  }
  /**
   * Provides access to the BaseLlmClient for stateless LLM operations.
   */
  getBaseLlmClient() {
    if (!this.baseLlmClient) {
      // Handle cases where initialization might be deferred or authentication failed
      if (this.contentGenerator) {
        this.baseLlmClient = new BaseLlmClient(
          this.getContentGenerator(),
          this,
        );
      } else {
        throw new Error(
          'BaseLlmClient not initialized. Ensure authentication has occurred and ContentGenerator is ready.',
        );
      }
    }
    return this.baseLlmClient;
  }
  getSessionId() {
    return this.sessionId;
  }
  shouldLoadMemoryFromIncludeDirectories() {
    return this.loadMemoryFromIncludeDirectories;
  }
  getContentGeneratorConfig() {
    return this.contentGeneratorConfig;
  }
  getModel() {
    return this.model;
  }
  setModel(newModel) {
    // Do not allow Pro usage if the user is in fallback mode.
    if (newModel.includes('pro') && this.isInFallbackMode()) {
      return;
    }
    this.model = newModel;
  }
  isInFallbackMode() {
    return this.inFallbackMode;
  }
  setFallbackMode(active) {
    this.inFallbackMode = active;
  }
  setFallbackModelHandler(handler) {
    this.fallbackModelHandler = handler;
  }
  getMaxSessionTurns() {
    return this.maxSessionTurns;
  }
  setQuotaErrorOccurred(value) {
    this.quotaErrorOccurred = value;
  }
  getQuotaErrorOccurred() {
    return this.quotaErrorOccurred;
  }
  getEmbeddingModel() {
    return this.embeddingModel;
  }
  getSandbox() {
    console.log('[DEBUG] Config.getSandbox() returning:', this.sandbox);
    return this.sandbox;
  }
  isRestrictiveSandbox() {
    const sandboxConfig = this.getSandbox();
    const seatbeltProfile = process.env['SEATBELT_PROFILE'];
    return (
      !!sandboxConfig &&
      sandboxConfig.command === 'sandbox-exec' &&
      !!seatbeltProfile &&
      seatbeltProfile.startsWith('restrictive-')
    );
  }
  getTargetDir() {
    return this.targetDir;
  }
  getProjectRoot() {
    return this.targetDir;
  }
  getWorkspaceContext() {
    return this.workspaceContext;
  }
  getToolRegistry() {
    return this.toolRegistry;
  }
  getPromptRegistry() {
    return this.promptRegistry;
  }
  getDebugMode() {
    return this.debugMode;
  }
  getQuestion() {
    return this.question;
  }
  getFullContext() {
    return this.fullContext;
  }
  getCoreTools() {
    return this.coreTools;
  }
  getAllowedTools() {
    return this.allowedTools;
  }
  getExcludeTools() {
    return this.excludeTools;
  }
  getToolDiscoveryCommand() {
    return this.toolDiscoveryCommand;
  }
  getToolCallCommand() {
    return this.toolCallCommand;
  }
  getMcpServerCommand() {
    return this.mcpServerCommand;
  }
  getMcpServers() {
    return this.mcpServers;
  }
  getUserMemory() {
    return this.userMemory;
  }
  setUserMemory(newUserMemory) {
    this.userMemory = newUserMemory;
  }
  getGeminiMdFileCount() {
    return this.geminiMdFileCount;
  }
  setGeminiMdFileCount(count) {
    this.geminiMdFileCount = count;
  }
  getApprovalMode() {
    return this.approvalMode;
  }
  setApprovalMode(mode) {
    if (!this.isTrustedFolder() && mode !== ApprovalMode.DEFAULT) {
      throw new Error(
        'Cannot enable privileged approval modes in an untrusted folder.',
      );
    }
    this.approvalMode = mode;
  }
  getShowMemoryUsage() {
    return this.showMemoryUsage;
  }
  getAccessibility() {
    return this.accessibility;
  }
  getTelemetryEnabled() {
    return this.telemetrySettings.enabled ?? false;
  }
  getTelemetryLogPromptsEnabled() {
    return this.telemetrySettings.logPrompts ?? true;
  }
  getTelemetryOtlpEndpoint() {
    return this.telemetrySettings.otlpEndpoint ?? DEFAULT_OTLP_ENDPOINT;
  }
  getTelemetryOtlpProtocol() {
    return this.telemetrySettings.otlpProtocol ?? 'grpc';
  }
  getTelemetryTarget() {
    return this.telemetrySettings.target ?? DEFAULT_TELEMETRY_TARGET;
  }
  getTelemetryOutfile() {
    return this.telemetrySettings.outfile;
  }
  getTelemetryUseCollector() {
    return this.telemetrySettings.useCollector ?? false;
  }
  getGeminiClient() {
    return this.geminiClient;
  }
  getModelRouterService() {
    return this.modelRouterService;
  }
  getEnableRecursiveFileSearch() {
    return this.fileFiltering.enableRecursiveFileSearch;
  }
  getFileFilteringDisableFuzzySearch() {
    return this.fileFiltering.disableFuzzySearch;
  }
  getFileFilteringRespectGitIgnore() {
    return this.fileFiltering.respectGitIgnore;
  }
  getFileFilteringRespectGeminiIgnore() {
    return this.fileFiltering.respectGeminiIgnore;
  }
  getFileFilteringOptions() {
    return {
      respectGitIgnore: this.fileFiltering.respectGitIgnore,
      respectGeminiIgnore: this.fileFiltering.respectGeminiIgnore,
    };
  }
  /**
   * Gets custom file exclusion patterns from configuration.
   * TODO: This is a placeholder implementation. In the future, this could
   * read from settings files, CLI arguments, or environment variables.
   */
  getCustomExcludes() {
    // Placeholder implementation - returns empty array for now
    // Future implementation could read from:
    // - User settings file
    // - Project-specific configuration
    // - Environment variables
    // - CLI arguments
    return [];
  }
  getCheckpointingEnabled() {
    return this.checkpointing;
  }
  getProxy() {
    return this.proxy;
  }
  getWorkingDir() {
    return this.cwd;
  }
  getBugCommand() {
    return this.bugCommand;
  }
  getFileService() {
    if (!this.fileDiscoveryService) {
      this.fileDiscoveryService = new FileDiscoveryService(this.targetDir);
    }
    return this.fileDiscoveryService;
  }
  getUsageStatisticsEnabled() {
    return this.usageStatisticsEnabled;
  }
  getExtensionContextFilePaths() {
    return this.extensionContextFilePaths;
  }
  getExperimentalZedIntegration() {
    return this.experimentalZedIntegration;
  }
  getListExtensions() {
    return this.listExtensions;
  }
  getExtensionManagement() {
    return this.extensionManagement;
  }
  getExtensions() {
    return this._extensions;
  }
  getBlockedMcpServers() {
    return this._blockedMcpServers;
  }
  getNoBrowser() {
    return this.noBrowser;
  }
  isBrowserLaunchSuppressed() {
    return this.getNoBrowser() || !shouldAttemptBrowserLaunch();
  }
  getSummarizeToolOutputConfig() {
    return this.summarizeToolOutput;
  }
  getIdeMode() {
    return this.ideMode;
  }
  getFolderTrustFeature() {
    return this.folderTrustFeature;
  }
  /**
   * Returns 'true' if the workspace is considered "trusted".
   * 'false' for untrusted.
   */
  getFolderTrust() {
    return this.folderTrust;
  }
  isTrustedFolder() {
    // isWorkspaceTrusted in cli/src/config/trustedFolder.js returns undefined
    // when the file based trust value is unavailable, since it is mainly used
    // in the initialization for trust dialogs, etc. Here we return true since
    // config.isTrustedFolder() is used for the main business logic of blocking
    // tool calls etc in the rest of the application.
    //
    // Default value is true since we load with trusted settings to avoid
    // restarts in the more common path. If the user chooses to mark the folder
    // as untrusted, the CLI will restart and we will have the trust value
    // reloaded.
    const context = ideContextStore.get();
    if (context?.workspaceState?.isTrusted !== undefined) {
      return context.workspaceState.isTrusted;
    }
    return this.trustedFolder ?? true;
  }
  setIdeMode(value) {
    this.ideMode = value;
  }
  /**
   * Get the current FileSystemService
   */
  getFileSystemService() {
    return this.fileSystemService;
  }
  /**
   * Set a custom FileSystemService
   */
  setFileSystemService(fileSystemService) {
    this.fileSystemService = fileSystemService;
  }
  getChatCompression() {
    return this.chatCompression;
  }
  isInteractive() {
    return this.interactive;
  }
  getUseRipgrep() {
    return this.useRipgrep;
  }
  getShouldUseNodePtyShell() {
    return this.shouldUseNodePtyShell;
  }
  getSkipNextSpeakerCheck() {
    return this.skipNextSpeakerCheck;
  }
  getShellExecutionConfig() {
    return this.shellExecutionConfig;
  }
  setShellExecutionConfig(config) {
    this.shellExecutionConfig = {
      terminalWidth:
        config.terminalWidth ?? this.shellExecutionConfig.terminalWidth,
      terminalHeight:
        config.terminalHeight ?? this.shellExecutionConfig.terminalHeight,
      showColor: config.showColor ?? this.shellExecutionConfig.showColor,
      pager: config.pager ?? this.shellExecutionConfig.pager,
    };
  }
  getScreenReader() {
    return this.accessibility.screenReader ?? false;
  }
  getEnablePromptCompletion() {
    return this.enablePromptCompletion;
  }
  getEnableToolOutputTruncation() {
    return this.enableToolOutputTruncation;
  }
  getTruncateToolOutputThreshold() {
    return Math.min(
      // Estimate remaining context window in characters (1 token ~= 4 chars).
      4 *
        (tokenLimit(this.model) - uiTelemetryService.getLastPromptTokenCount()),
      this.truncateToolOutputThreshold,
    );
  }
  getTruncateToolOutputLines() {
    return this.truncateToolOutputLines;
  }
  getUseSmartEdit() {
    return this.useSmartEdit;
  }
  getUseWriteTodos() {
    return this.useWriteTodos;
  }
  getOutputFormat() {
    return this.outputSettings?.format
      ? this.outputSettings.format
      : OutputFormat.TEXT;
  }
  getUseModelRouter() {
    return this.useModelRouter;
  }
  async getGitService() {
    if (!this.gitService) {
      this.gitService = new GitService(this.targetDir, this.storage);
      await this.gitService.initialize();
    }
    return this.gitService;
  }
  getFileExclusions() {
    return this.fileExclusions;
  }
  getMessageBus() {
    return this.messageBus;
  }
  getPolicyEngine() {
    return this.policyEngine;
  }
  getEnableMessageBusIntegration() {
    return this.enableMessageBusIntegration;
  }
  async createToolRegistry() {
    // Import logger for performance tracking
    const { getComponentLogger, createTimer, LogLevel } = await import(
      '../utils/logger.js'
    );
    const logger = getComponentLogger('ToolRegistry', {
      sessionId: this.sessionId,
    });
    const endTimer = createTimer(logger, 'createToolRegistry', LogLevel.DEBUG);
    try {
      const registry = new ToolRegistry(this, this.eventEmitter);
      // helper to create & register core tools that are enabled

      const registerCoreTool = (ToolClass, ...args) => {
        const className = ToolClass.name;
        const toolName = ToolClass.Name || className;
        const coreTools = this.getCoreTools();
        const excludeTools = this.getExcludeTools() || [];
        // On some platforms, the className can be minified to _ClassName.
        const normalizedClassName = className.replace(/^_+/, '');
        let isEnabled = true; // Enabled by default if coreTools is not set.
        if (coreTools) {
          isEnabled = coreTools.some(
            (tool) =>
              tool === toolName ||
              tool === normalizedClassName ||
              tool.startsWith(`${toolName}(`) ||
              tool.startsWith(`${normalizedClassName}(`),
          );
        }
        const isExcluded = excludeTools.some(
          (tool) => tool === toolName || tool === normalizedClassName,
        );
        if (isExcluded) {
          isEnabled = false;
        }
        if (isEnabled) {
          // Pass message bus to tools when feature flag is enabled
          // This first implementation is only focused on the general case of
          // the tool registry.
          const messageBusEnabled = this.getEnableMessageBusIntegration();
          if (this.debugMode && messageBusEnabled) {
            console.log(
              `[DEBUG] enableMessageBusIntegration setting: ${messageBusEnabled}`,
            );
          }
          const toolArgs = messageBusEnabled
            ? [...args, this.getMessageBus()]
            : args;
          if (this.debugMode && messageBusEnabled) {
            console.log(
              `[DEBUG] Registering ${className} with messageBus: ${messageBusEnabled ? 'YES' : 'NO'}`,
            );
          }
          registry.registerTool(new ToolClass(...toolArgs));
        }
      };
      registerCoreTool(LSTool, this);
      registerCoreTool(ReadFileTool, this);
      if (this.getUseRipgrep()) {
        let useRipgrep = false;
        let errorString = undefined;
        try {
          useRipgrep = await canUseRipgrep();
        } catch (error) {
          errorString = String(error);
        }
        if (useRipgrep) {
          registerCoreTool(RipGrepTool, this);
        } else {
          logRipgrepFallback(this, new RipgrepFallbackEvent(errorString));
          registerCoreTool(GrepTool, this);
        }
      } else {
        registerCoreTool(GrepTool, this);
      }
      registerCoreTool(GlobTool, this);
      if (this.getUseSmartEdit()) {
        registerCoreTool(SmartEditTool, this);
      } else {
        registerCoreTool(EditTool, this);
      }
      registerCoreTool(WriteFileTool, this);
      registerCoreTool(WebFetchTool, this);
      registerCoreTool(ReadManyFilesTool, this);
      registerCoreTool(ShellTool, this);
      registerCoreTool(MemoryTool);
      registerCoreTool(WebSearchTool, this);
      if (this.getUseWriteTodos()) {
        registerCoreTool(WriteTodosTool, this);
      }
      await registry.discoverAllTools();
      logger.debug('Tool registry created successfully', {
        coreToolCount: registry
          .getAllToolNames()
          .filter((name) => !name.startsWith('mcp:')).length,
        totalToolCount: registry.getAllToolNames().length,
      });
      return registry;
    } catch (error) {
      logger.error('Tool registry creation failed', { error });
      throw error;
    } finally {
      endTimer();
    }
  }
}
// Export model constants for use in CLI
export { DEFAULT_GEMINI_FLASH_MODEL };
//# sourceMappingURL=config.js.map
