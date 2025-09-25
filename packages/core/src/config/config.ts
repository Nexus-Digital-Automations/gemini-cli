/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as path from 'node:path';
import process from 'node:process';
import type {
  ContentGenerator,
  ContentGeneratorConfig,
} from '../core/contentGenerator.js';
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
import type { TelemetryTarget } from '../telemetry/index.js';
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
import type { MCPOAuthConfig } from '../mcp/oauth-provider.js';
import { ideContextStore } from '../ide/ideContext.js';
import { WriteTodosTool } from '../tools/write-todos.js';
import type { FileSystemService } from '../services/fileSystemService.js';
import { StandardFileSystemService } from '../services/fileSystemService.js';
import {
  logCliConfiguration,
  logRipgrepFallback,
} from '../telemetry/loggers.js';
import { RipgrepFallbackEvent } from '../telemetry/types.js';
import type { FallbackModelHandler } from '../fallback/types.js';
import { ModelRouterService } from '../routing/modelRouterService.js';
import { OutputFormat } from '../output/types.js';

// Re-export OAuth config type
export type { MCPOAuthConfig, AnyToolInvocation };
import type { AnyToolInvocation } from '../tools/tools.js';
import { WorkspaceContext } from '../utils/workspaceContext.js';
import { Storage } from './storage.js';
import type { ShellExecutionConfig } from '../services/shellExecutionService.js';
import { FileExclusions } from '../utils/ignorePatterns.js';
import type { EventEmitter } from 'node:events';
import { MessageBus } from '../confirmation-bus/message-bus.js';
import { PolicyEngine } from '../policy/policy-engine.js';
import type { PolicyEngineConfig } from '../policy/types.js';
import type { UserTierId } from '../code_assist/types.js';
import { ProxyAgent, setGlobalDispatcher } from 'undici';

/**
 * Tool execution approval modes that control how the application handles tool calls.
 * Determines the level of user interaction required before executing potentially dangerous operations.
 *
 * Security Note: Higher automation modes should only be used in trusted environments.
 */
export enum ApprovalMode {
  /** Default mode requiring user approval for each tool call */
  DEFAULT = 'default',
  /** Automatically approve edit operations but require approval for other tools */
  AUTO_EDIT = 'autoEdit',
  /** Automatically approve all tool calls without user confirmation (use with caution) */
  YOLO = 'yolo',
}

/**
 * Configuration options for accessibility features and screen reader compatibility.
 * Ensures the application is usable by people with different accessibility needs.
 */
export interface AccessibilitySettings {
  /** Disable animated loading phrases for users who find them distracting */
  disableLoadingPhrases?: boolean;
  /** Enable screen reader compatibility mode with simplified text output */
  screenReader?: boolean;
}

/**
 * Configuration for the bug reporting command functionality.
 * Defines how bug reports are generated and where they are submitted.
 */
export interface BugCommandSettings {
  /** URL template for bug report submission with placeholder support */
  urlTemplate: string;
}

/**
 * Configuration for chat context compression to manage token usage.
 * Helps maintain conversation context while staying within model limits.
 */
export interface ChatCompressionSettings {
  /** Percentage of context window usage that triggers compression (0-100) */
  contextPercentageThreshold?: number;
}

/**
 * Configuration for tool output summarization to manage context consumption.
 * Prevents tool outputs from overwhelming the conversation context.
 */
export interface SummarizeToolOutputSettings {
  /** Maximum tokens allocated for tool output before summarization is applied */
  tokenBudget?: number;
}

/**
 * Configuration for telemetry data collection and reporting.
 * Controls what usage data is collected and where it's sent for analysis.
 */
export interface TelemetrySettings {
  /** Whether telemetry collection is enabled */
  enabled?: boolean;
  /** Target system for telemetry data (console, file, otlp, etc.) */
  target?: TelemetryTarget;
  /** OTLP endpoint URL for telemetry data submission */
  otlpEndpoint?: string;
  /** Protocol to use for OTLP communication (gRPC or HTTP) */
  otlpProtocol?: 'grpc' | 'http';
  /** Whether to include prompts and model interactions in telemetry */
  logPrompts?: boolean;
  /** File path for telemetry output when using file target */
  outfile?: string;
  /** Whether to use an external telemetry collector */
  useCollector?: boolean;
}

/**
 * Configuration for command output formatting and presentation.
 * Determines how the application displays results and responses.
 */
export interface OutputSettings {
  /** Output format (text, JSON, etc.) for command results */
  format?: OutputFormat;
}

/**
 * Represents an installed Gemini CLI extension with its configuration and metadata.
 * Extensions provide additional tools, commands, and functionality to the CLI.
 */
export interface GeminiCLIExtension {
  /** Unique name identifier for the extension */
  name: string;
  /** Version string of the installed extension */
  version: string;
  /** Whether the extension is currently active and loaded */
  isActive: boolean;
  /** File system path to the extension's installation directory */
  path: string;
  /** Optional metadata about how the extension was installed */
  installMetadata?: ExtensionInstallMetadata;
}

/**
 * Metadata about how an extension was installed and configured.
 * Used for extension management, updates, and troubleshooting.
 */
export interface ExtensionInstallMetadata {
  /** Source URL or path where the extension was installed from */
  source: string;
  /** Installation method used (git clone, local path, symlink, GitHub release) */
  type: 'git' | 'local' | 'link' | 'github-release';
  /** GitHub release tag (only present for github-release installs) */
  releaseTag?: string;
  /** Git reference (branch, tag, commit) for git-based installs */
  ref?: string;
  /** Whether the extension should auto-update when new versions are available */
  autoUpdate?: boolean;
}

/**
 * Configuration for file discovery and filtering behavior.
 * Controls which files are included or excluded during workspace analysis.
 */
export interface FileFilteringOptions {
  /** Whether to respect .gitignore files when discovering files */
  respectGitIgnore: boolean;
  /** Whether to respect .geminiignore files when discovering files */
  respectGeminiIgnore: boolean;
}
/** Default file filtering options for memory/context files (more permissive for documentation) */
export const DEFAULT_MEMORY_FILE_FILTERING_OPTIONS: FileFilteringOptions = {
  respectGitIgnore: false,
  respectGeminiIgnore: true,
};
/** Default file filtering options for general file operations (respects both ignore files) */
export const DEFAULT_FILE_FILTERING_OPTIONS: FileFilteringOptions = {
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
  constructor(
    // For stdio transport
    /** Command to execute for stdio-based MCP servers */
    readonly command?: string,
    /** Command line arguments for the MCP server process */
    readonly args?: string[],
    /** Environment variables to set for the MCP server process */
    readonly env?: Record<string, string>,
    /** Working directory for the MCP server process */
    readonly cwd?: string,
    // For sse transport
    /** URL for server-sent events transport */
    readonly url?: string,
    // For streamable http transport
    /** URL for HTTP-based MCP communication */
    readonly httpUrl?: string,
    /** HTTP headers to include in requests */
    readonly headers?: Record<string, string>,
    // For websocket transport
    /** TCP address for WebSocket transport */
    readonly tcp?: string,
    // Common
    /** Connection timeout in milliseconds */
    readonly timeout?: number,
    /** Whether this MCP server is trusted for automatic execution */
    readonly trust?: boolean,
    // Metadata
    /** Human-readable description of the MCP server's purpose */
    readonly description?: string,
    /** Specific tools to include from this server (whitelist) */
    readonly includeTools?: string[],
    /** Specific tools to exclude from this server (blacklist) */
    readonly excludeTools?: string[],
    /** Name of the extension that provides this MCP server */
    readonly extensionName?: string,
    // OAuth configuration
    /** OAuth configuration for authenticated MCP servers */
    readonly oauth?: MCPOAuthConfig,
    /** Type of authentication provider to use */
    readonly authProviderType?: AuthProviderType,
  ) {}
}

/**
 * Types of authentication providers supported for MCP server connections.
 * Determines how authentication credentials are obtained and managed.
 */
export enum AuthProviderType {
  /** Dynamically discover authentication method through server negotiation */
  DYNAMIC_DISCOVERY = 'dynamic_discovery',
  /** Use Google Cloud credentials for authentication */
  GOOGLE_CREDENTIALS = 'google_credentials',
}

/**
 * Configuration for sandboxed execution environments.
 * Provides isolation for potentially dangerous operations.
 */
export interface SandboxConfig {
  /** Sandboxing technology to use (Docker, Podman, or macOS sandbox-exec) */
  command: 'docker' | 'podman' | 'sandbox-exec';
  /** Container image name or sandbox profile to use (undefined for sandbox-exec) */
  image: string | undefined;
}

/**
 * Complete configuration parameters for initializing the Gemini CLI Config class.
 * Contains all settings needed to configure the application's behavior, tools, and integrations.
 *
 * This interface serves as the primary configuration contract for the application,
 * combining user preferences, system settings, and runtime parameters.
 *
 * @example
 * ```typescript
 * const configParams: ConfigParameters = {
 *   sessionId: 'unique-session-id',
 *   targetDir: '/workspace/project',
 *   debugMode: false,
 *   model: 'gemini-1.5-flash',
 *   cwd: process.cwd(),
 *   approvalMode: ApprovalMode.DEFAULT
 * };
 *
 * const config = new Config(configParams);
 * await config.initialize();
 * ```
 */
export interface ConfigParameters {
  /** Unique identifier for this configuration session */
  sessionId: string;
  /** Embedding model to use for vector operations */
  embeddingModel?: string;
  /** Sandbox configuration for isolated execution */
  sandbox?: SandboxConfig;
  /** Target directory for the workspace/project */
  targetDir: string;
  /** Whether debug mode is enabled for verbose logging */
  debugMode: boolean;
  /** Initial question or prompt for the session */
  question?: string;
  /** Whether to load full workspace context */
  fullContext?: boolean;
  /** List of core tools to enable */
  coreTools?: string[];
  /** List of tools that bypass approval dialogs */
  allowedTools?: string[];
  /** List of tools to exclude from loading */
  excludeTools?: string[];
  /** Command for discovering additional tools */
  toolDiscoveryCommand?: string;
  /** Command for executing tool calls */
  toolCallCommand?: string;
  /** Command for starting MCP servers */
  mcpServerCommand?: string;
  /** Configuration for MCP servers */
  mcpServers?: Record<string, MCPServerConfig>;
  /** User-specific memory/context content */
  userMemory?: string;
  /** Number of Gemini markdown files in context */
  geminiMdFileCount?: number;
  /** Tool execution approval mode */
  approvalMode?: ApprovalMode;
  /** Whether to display memory usage information */
  showMemoryUsage?: boolean;
  /** Context file name(s) to load */
  contextFileName?: string | string[];
  /** Accessibility-related settings */
  accessibility?: AccessibilitySettings;
  /** Telemetry collection configuration */
  telemetry?: TelemetrySettings;
  /** Whether usage statistics collection is enabled */
  usageStatisticsEnabled?: boolean;
  /** File filtering and discovery options */
  fileFiltering?: {
    respectGitIgnore?: boolean;
    respectGeminiIgnore?: boolean;
    enableRecursiveFileSearch?: boolean;
    disableFuzzySearch?: boolean;
  };
  /** Whether session checkpointing is enabled */
  checkpointing?: boolean;
  /** HTTP proxy configuration */
  proxy?: string;
  /** Current working directory */
  cwd: string;
  /** Custom file discovery service implementation */
  fileDiscoveryService?: FileDiscoveryService;
  /** Additional directories to include in context */
  includeDirectories?: string[];
  /** Bug reporting command configuration */
  bugCommand?: BugCommandSettings;
  /** AI model to use for conversations */
  model: string;
  /** File paths for extension context */
  extensionContextFilePaths?: string[];
  /** Maximum number of conversation turns to maintain */
  maxSessionTurns?: number;
  /** Whether experimental Zed editor integration is enabled */
  experimentalZedIntegration?: boolean;
  /** Whether to list available extensions */
  listExtensions?: boolean;
  /** Loaded extension configurations */
  extensions?: GeminiCLIExtension[];
  /** MCP servers blocked by policy */
  blockedMcpServers?: Array<{ name: string; extensionName: string }>;
  /** Whether to suppress browser launches */
  noBrowser?: boolean;
  /** Tool output summarization settings */
  summarizeToolOutput?: Record<string, SummarizeToolOutputSettings>;
  /** Whether folder trust feature is available */
  folderTrustFeature?: boolean;
  /** Whether current folder is trusted */
  folderTrust?: boolean;
  /** Whether IDE integration mode is active */
  ideMode?: boolean;
  /** Whether to load memory from include directories */
  loadMemoryFromIncludeDirectories?: boolean;
  /** Chat compression settings */
  chatCompression?: ChatCompressionSettings;
  /** Whether running in interactive mode */
  interactive?: boolean;
  /** Legacy trusted folder setting */
  trustedFolder?: boolean;
  /** Whether to use ripgrep for file searching */
  useRipgrep?: boolean;
  /** Whether to use node-pty for shell execution */
  shouldUseNodePtyShell?: boolean;
  /** Whether to skip next speaker validation */
  skipNextSpeakerCheck?: boolean;
  /** Shell execution configuration */
  shellExecutionConfig?: ShellExecutionConfig;
  /** Whether extension management is enabled */
  extensionManagement?: boolean;
  /** Whether AI-powered prompt completion is enabled */
  enablePromptCompletion?: boolean;
  /** Character threshold for tool output truncation */
  truncateToolOutputThreshold?: number;
  /** Line count for tool output truncation */
  truncateToolOutputLines?: number;
  /** Whether tool output truncation is enabled */
  enableToolOutputTruncation?: boolean;
  /** Event emitter for application events */
  eventEmitter?: EventEmitter;
  /** Whether to use smart edit instead of regular edit */
  useSmartEdit?: boolean;
  /** Whether to enable todo writing tools */
  useWriteTodos?: boolean;
  /** Policy engine configuration */
  policyEngineConfig?: PolicyEngineConfig;
  /** Output formatting settings */
  output?: OutputSettings;
  /** Whether to use the model router for request routing */
  useModelRouter?: boolean;
  /** Whether message bus integration is enabled */
  enableMessageBusIntegration?: boolean;
}

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
  private toolRegistry!: ToolRegistry;
  private promptRegistry!: PromptRegistry;
  private readonly sessionId: string;
  private fileSystemService: FileSystemService;
  private contentGeneratorConfig!: ContentGeneratorConfig;
  private contentGenerator!: ContentGenerator;
  private readonly embeddingModel: string;
  private readonly sandbox: SandboxConfig | undefined;
  private readonly targetDir: string;
  private workspaceContext: WorkspaceContext;
  private readonly debugMode: boolean;
  private readonly question: string | undefined;
  private readonly fullContext: boolean;
  private readonly coreTools: string[] | undefined;
  private readonly allowedTools: string[] | undefined;
  private readonly excludeTools: string[] | undefined;
  private readonly toolDiscoveryCommand: string | undefined;
  private readonly toolCallCommand: string | undefined;
  private readonly mcpServerCommand: string | undefined;
  private readonly mcpServers: Record<string, MCPServerConfig> | undefined;
  private userMemory: string;
  private geminiMdFileCount: number;
  private approvalMode: ApprovalMode;
  private readonly showMemoryUsage: boolean;
  private readonly accessibility: AccessibilitySettings;
  private readonly telemetrySettings: TelemetrySettings;
  private readonly usageStatisticsEnabled: boolean;
  private geminiClient!: GeminiClient;
  private baseLlmClient!: BaseLlmClient;
  private modelRouterService: ModelRouterService;
  private readonly fileFiltering: {
    respectGitIgnore: boolean;
    respectGeminiIgnore: boolean;
    enableRecursiveFileSearch: boolean;
    disableFuzzySearch: boolean;
  };
  private fileDiscoveryService: FileDiscoveryService | null = null;
  private gitService: GitService | undefined = undefined;
  private readonly checkpointing: boolean;
  private readonly proxy: string | undefined;
  private readonly cwd: string;
  private readonly bugCommand: BugCommandSettings | undefined;
  private model: string;
  private readonly extensionContextFilePaths: string[];
  private readonly noBrowser: boolean;
  private readonly folderTrustFeature: boolean;
  private readonly folderTrust: boolean;
  private ideMode: boolean;

  private inFallbackMode = false;
  private readonly maxSessionTurns: number;
  private readonly listExtensions: boolean;
  private readonly _extensions: GeminiCLIExtension[];
  private readonly _blockedMcpServers: Array<{
    name: string;
    extensionName: string;
  }>;
  fallbackModelHandler?: FallbackModelHandler;
  private quotaErrorOccurred: boolean = false;
  private readonly summarizeToolOutput:
    | Record<string, SummarizeToolOutputSettings>
    | undefined;
  private readonly experimentalZedIntegration: boolean = false;
  private readonly loadMemoryFromIncludeDirectories: boolean = false;
  private readonly chatCompression: ChatCompressionSettings | undefined;
  private readonly interactive: boolean;
  private readonly trustedFolder: boolean | undefined;
  private readonly useRipgrep: boolean;
  private readonly shouldUseNodePtyShell: boolean;
  private readonly skipNextSpeakerCheck: boolean;
  private shellExecutionConfig: ShellExecutionConfig;
  private readonly extensionManagement: boolean = true;
  private readonly enablePromptCompletion: boolean = false;
  private readonly truncateToolOutputThreshold: number;
  private readonly truncateToolOutputLines: number;
  private readonly enableToolOutputTruncation: boolean;
  private initialized: boolean = false;
  readonly storage: Storage;
  private readonly fileExclusions: FileExclusions;
  private readonly eventEmitter?: EventEmitter;
  private readonly useSmartEdit: boolean;
  private readonly useWriteTodos: boolean;
  private readonly messageBus: MessageBus;
  private readonly policyEngine: PolicyEngine;
  private readonly outputSettings: OutputSettings;
  private readonly useModelRouter: boolean;
  private readonly enableMessageBusIntegration: boolean;

  /**
   * Creates a new Config instance with the provided parameters.
   * Performs synchronous initialization of configuration properties.
   * Call initialize() after construction for async setup.
   *
   * @param params - Complete configuration parameters
   */
  constructor(params: ConfigParameters) {
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
      setGlobalDispatcher(new ProxyAgent(this.getProxy() as string));
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
  async initialize(): Promise<void> {
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
      const phase1Promises: Array<Promise<void>> = [];

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
      const phase2Promises: Array<Promise<void>> = [];

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
      logger.error('Config initialization failed', { error: error as Error });
      throw error;
    } finally {
      endTimer();
    }
  }

  getContentGenerator(): ContentGenerator {
    return this.contentGenerator;
  }

  async refreshAuth(authMethod: AuthType) {
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

  getUserTier(): UserTierId | undefined {
    return this.contentGenerator?.userTier;
  }

  /**
   * Provides access to the BaseLlmClient for stateless LLM operations.
   */
  getBaseLlmClient(): BaseLlmClient {
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

  getSessionId(): string {
    return this.sessionId;
  }

  shouldLoadMemoryFromIncludeDirectories(): boolean {
    return this.loadMemoryFromIncludeDirectories;
  }

  getContentGeneratorConfig(): ContentGeneratorConfig {
    return this.contentGeneratorConfig;
  }

  getModel(): string {
    return this.model;
  }

  setModel(newModel: string): void {
    // Do not allow Pro usage if the user is in fallback mode.
    if (newModel.includes('pro') && this.isInFallbackMode()) {
      return;
    }

    this.model = newModel;
  }

  isInFallbackMode(): boolean {
    return this.inFallbackMode;
  }

  setFallbackMode(active: boolean): void {
    this.inFallbackMode = active;
  }

  setFallbackModelHandler(handler: FallbackModelHandler): void {
    this.fallbackModelHandler = handler;
  }

  getMaxSessionTurns(): number {
    return this.maxSessionTurns;
  }

  setQuotaErrorOccurred(value: boolean): void {
    this.quotaErrorOccurred = value;
  }

  getQuotaErrorOccurred(): boolean {
    return this.quotaErrorOccurred;
  }

  getEmbeddingModel(): string {
    return this.embeddingModel;
  }

  getSandbox(): SandboxConfig | undefined {
    console.log('[DEBUG] Config.getSandbox() returning:', this.sandbox);
    return this.sandbox;
  }

  isRestrictiveSandbox(): boolean {
    const sandboxConfig = this.getSandbox();
    const seatbeltProfile = process.env['SEATBELT_PROFILE'];
    return (
      !!sandboxConfig &&
      sandboxConfig.command === 'sandbox-exec' &&
      !!seatbeltProfile &&
      seatbeltProfile.startsWith('restrictive-')
    );
  }

  getTargetDir(): string {
    return this.targetDir;
  }

  getProjectRoot(): string {
    return this.targetDir;
  }

  getWorkspaceContext(): WorkspaceContext {
    return this.workspaceContext;
  }

  getToolRegistry(): ToolRegistry {
    return this.toolRegistry;
  }

  getPromptRegistry(): PromptRegistry {
    return this.promptRegistry;
  }

  getDebugMode(): boolean {
    return this.debugMode;
  }
  getQuestion(): string | undefined {
    return this.question;
  }

  getFullContext(): boolean {
    return this.fullContext;
  }

  getCoreTools(): string[] | undefined {
    return this.coreTools;
  }

  getAllowedTools(): string[] | undefined {
    return this.allowedTools;
  }

  getExcludeTools(): string[] | undefined {
    return this.excludeTools;
  }

  getToolDiscoveryCommand(): string | undefined {
    return this.toolDiscoveryCommand;
  }

  getToolCallCommand(): string | undefined {
    return this.toolCallCommand;
  }

  getMcpServerCommand(): string | undefined {
    return this.mcpServerCommand;
  }

  getMcpServers(): Record<string, MCPServerConfig> | undefined {
    return this.mcpServers;
  }

  getUserMemory(): string {
    return this.userMemory;
  }

  setUserMemory(newUserMemory: string): void {
    this.userMemory = newUserMemory;
  }

  getGeminiMdFileCount(): number {
    return this.geminiMdFileCount;
  }

  setGeminiMdFileCount(count: number): void {
    this.geminiMdFileCount = count;
  }

  getApprovalMode(): ApprovalMode {
    return this.approvalMode;
  }

  setApprovalMode(mode: ApprovalMode): void {
    if (!this.isTrustedFolder() && mode !== ApprovalMode.DEFAULT) {
      throw new Error(
        'Cannot enable privileged approval modes in an untrusted folder.',
      );
    }
    this.approvalMode = mode;
  }

  getShowMemoryUsage(): boolean {
    return this.showMemoryUsage;
  }

  getAccessibility(): AccessibilitySettings {
    return this.accessibility;
  }

  getTelemetryEnabled(): boolean {
    return this.telemetrySettings.enabled ?? false;
  }

  getTelemetryLogPromptsEnabled(): boolean {
    return this.telemetrySettings.logPrompts ?? true;
  }

  getTelemetryOtlpEndpoint(): string {
    return this.telemetrySettings.otlpEndpoint ?? DEFAULT_OTLP_ENDPOINT;
  }

  getTelemetryOtlpProtocol(): 'grpc' | 'http' {
    return this.telemetrySettings.otlpProtocol ?? 'grpc';
  }

  getTelemetryTarget(): TelemetryTarget {
    return this.telemetrySettings.target ?? DEFAULT_TELEMETRY_TARGET;
  }

  getTelemetryOutfile(): string | undefined {
    return this.telemetrySettings.outfile;
  }

  getTelemetryUseCollector(): boolean {
    return this.telemetrySettings.useCollector ?? false;
  }

  getGeminiClient(): GeminiClient {
    return this.geminiClient;
  }

  getModelRouterService(): ModelRouterService {
    return this.modelRouterService;
  }

  getEnableRecursiveFileSearch(): boolean {
    return this.fileFiltering.enableRecursiveFileSearch;
  }

  getFileFilteringDisableFuzzySearch(): boolean {
    return this.fileFiltering.disableFuzzySearch;
  }

  getFileFilteringRespectGitIgnore(): boolean {
    return this.fileFiltering.respectGitIgnore;
  }
  getFileFilteringRespectGeminiIgnore(): boolean {
    return this.fileFiltering.respectGeminiIgnore;
  }

  getFileFilteringOptions(): FileFilteringOptions {
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
  getCustomExcludes(): string[] {
    // Placeholder implementation - returns empty array for now
    // Future implementation could read from:
    // - User settings file
    // - Project-specific configuration
    // - Environment variables
    // - CLI arguments
    return [];
  }

  getCheckpointingEnabled(): boolean {
    return this.checkpointing;
  }

  getProxy(): string | undefined {
    return this.proxy;
  }

  getWorkingDir(): string {
    return this.cwd;
  }

  getBugCommand(): BugCommandSettings | undefined {
    return this.bugCommand;
  }

  getFileService(): FileDiscoveryService {
    if (!this.fileDiscoveryService) {
      this.fileDiscoveryService = new FileDiscoveryService(this.targetDir);
    }
    return this.fileDiscoveryService;
  }

  getUsageStatisticsEnabled(): boolean {
    return this.usageStatisticsEnabled;
  }

  getExtensionContextFilePaths(): string[] {
    return this.extensionContextFilePaths;
  }

  getExperimentalZedIntegration(): boolean {
    return this.experimentalZedIntegration;
  }

  getListExtensions(): boolean {
    return this.listExtensions;
  }

  getExtensionManagement(): boolean {
    return this.extensionManagement;
  }

  getExtensions(): GeminiCLIExtension[] {
    return this._extensions;
  }

  getBlockedMcpServers(): Array<{ name: string; extensionName: string }> {
    return this._blockedMcpServers;
  }

  getNoBrowser(): boolean {
    return this.noBrowser;
  }

  isBrowserLaunchSuppressed(): boolean {
    return this.getNoBrowser() || !shouldAttemptBrowserLaunch();
  }

  getSummarizeToolOutputConfig():
    | Record<string, SummarizeToolOutputSettings>
    | undefined {
    return this.summarizeToolOutput;
  }

  getIdeMode(): boolean {
    return this.ideMode;
  }

  getFolderTrustFeature(): boolean {
    return this.folderTrustFeature;
  }

  /**
   * Returns 'true' if the workspace is considered "trusted".
   * 'false' for untrusted.
   */
  getFolderTrust(): boolean {
    return this.folderTrust;
  }

  isTrustedFolder(): boolean {
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

  setIdeMode(value: boolean): void {
    this.ideMode = value;
  }

  /**
   * Get the current FileSystemService
   */
  getFileSystemService(): FileSystemService {
    return this.fileSystemService;
  }

  /**
   * Set a custom FileSystemService
   */
  setFileSystemService(fileSystemService: FileSystemService): void {
    this.fileSystemService = fileSystemService;
  }

  getChatCompression(): ChatCompressionSettings | undefined {
    return this.chatCompression;
  }

  isInteractive(): boolean {
    return this.interactive;
  }

  getUseRipgrep(): boolean {
    return this.useRipgrep;
  }

  getShouldUseNodePtyShell(): boolean {
    return this.shouldUseNodePtyShell;
  }

  getSkipNextSpeakerCheck(): boolean {
    return this.skipNextSpeakerCheck;
  }

  getShellExecutionConfig(): ShellExecutionConfig {
    return this.shellExecutionConfig;
  }

  setShellExecutionConfig(config: ShellExecutionConfig): void {
    this.shellExecutionConfig = {
      terminalWidth:
        config.terminalWidth ?? this.shellExecutionConfig.terminalWidth,
      terminalHeight:
        config.terminalHeight ?? this.shellExecutionConfig.terminalHeight,
      showColor: config.showColor ?? this.shellExecutionConfig.showColor,
      pager: config.pager ?? this.shellExecutionConfig.pager,
    };
  }
  getScreenReader(): boolean {
    return this.accessibility.screenReader ?? false;
  }

  getEnablePromptCompletion(): boolean {
    return this.enablePromptCompletion;
  }

  getEnableToolOutputTruncation(): boolean {
    return this.enableToolOutputTruncation;
  }

  getTruncateToolOutputThreshold(): number {
    return Math.min(
      // Estimate remaining context window in characters (1 token ~= 4 chars).
      4 *
        (tokenLimit(this.model) - uiTelemetryService.getLastPromptTokenCount()),
      this.truncateToolOutputThreshold,
    );
  }

  getTruncateToolOutputLines(): number {
    return this.truncateToolOutputLines;
  }

  getUseSmartEdit(): boolean {
    return this.useSmartEdit;
  }

  getUseWriteTodos(): boolean {
    return this.useWriteTodos;
  }

  getOutputFormat(): OutputFormat {
    return this.outputSettings?.format
      ? this.outputSettings.format
      : OutputFormat.TEXT;
  }

  getUseModelRouter(): boolean {
    return this.useModelRouter;
  }

  async getGitService(): Promise<GitService> {
    if (!this.gitService) {
      this.gitService = new GitService(this.targetDir, this.storage);
      await this.gitService.initialize();
    }
    return this.gitService;
  }

  getFileExclusions(): FileExclusions {
    return this.fileExclusions;
  }

  getMessageBus(): MessageBus {
    return this.messageBus;
  }

  getPolicyEngine(): PolicyEngine {
    return this.policyEngine;
  }

  getEnableMessageBusIntegration(): boolean {
    return this.enableMessageBusIntegration;
  }

  async createToolRegistry(): Promise<ToolRegistry> {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const registerCoreTool = (ToolClass: any, ...args: unknown[]) => {
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
        let errorString: undefined | string = undefined;
        try {
          useRipgrep = await canUseRipgrep();
        } catch (error: unknown) {
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
      logger.error('Tool registry creation failed', { error: error as Error });
      throw error;
    } finally {
      endTimer();
    }
  }
}
// Export model constants for use in CLI
export { DEFAULT_GEMINI_FLASH_MODEL };
