/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  ContentGenerator,
  ContentGeneratorConfig,
} from '../core/contentGenerator.js';
import type { AuthType } from '../core/contentGenerator.js';
import type { PromptRegistry } from '../prompts/prompt-registry.js';
import type { ToolRegistry } from '../tools/tool-registry.js';
import type { GeminiClient } from '../core/client.js';
import type { BaseLlmClient } from '../core/baseLlmClient.js';
import type { FileDiscoveryService } from '../services/fileDiscoveryService.js';
import type { GitService } from '../services/gitService.js';
import type { TelemetryTarget } from '../telemetry/index.js';
import { DEFAULT_GEMINI_FLASH_MODEL } from './models.js';
import type { MCPOAuthConfig } from '../mcp/oauth-provider.js';
import type { FileSystemService } from '../services/fileSystemService.js';
import type { FallbackModelHandler } from '../fallback/types.js';
import type { ModelRouterService } from '../routing/modelRouterService.js';
import type { OutputFormat } from '../output/types.js';
export type { MCPOAuthConfig, AnyToolInvocation };
import type { AnyToolInvocation } from '../tools/tools.js';
import type { WorkspaceContext } from '../utils/workspaceContext.js';
import type { Storage } from './storage.js';
import type { ShellExecutionConfig } from '../services/shellExecutionService.js';
import type { FileExclusions } from '../utils/ignorePatterns.js';
import type { EventEmitter } from 'node:events';
import type { MessageBus } from '../confirmation-bus/message-bus.js';
import type { PolicyEngine } from '../policy/policy-engine.js';
import type { PolicyEngineConfig } from '../policy/types.js';
import type { UserTierId } from '../code_assist/types.js';
/**
 * Tool execution approval modes that control how the application handles tool calls.
 * Determines the level of user interaction required before executing potentially dangerous operations.
 *
 * Security Note: Higher automation modes should only be used in trusted environments.
 */
export declare enum ApprovalMode {
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
export declare const DEFAULT_MEMORY_FILE_FILTERING_OPTIONS: FileFilteringOptions;
/** Default file filtering options for general file operations (respects both ignore files) */
export declare const DEFAULT_FILE_FILTERING_OPTIONS: FileFilteringOptions;
/** Default character threshold for truncating tool output to manage context window usage */
export declare const DEFAULT_TRUNCATE_TOOL_OUTPUT_THRESHOLD = 4000000;
/** Default number of lines to preserve when truncating tool output */
export declare const DEFAULT_TRUNCATE_TOOL_OUTPUT_LINES = 1000;
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
export declare class MCPServerConfig {
  /** Command to execute for stdio-based MCP servers */
  readonly command?: string | undefined;
  /** Command line arguments for the MCP server process */
  readonly args?: string[] | undefined;
  /** Environment variables to set for the MCP server process */
  readonly env?: Record<string, string> | undefined;
  /** Working directory for the MCP server process */
  readonly cwd?: string | undefined;
  /** URL for server-sent events transport */
  readonly url?: string | undefined;
  /** URL for HTTP-based MCP communication */
  readonly httpUrl?: string | undefined;
  /** HTTP headers to include in requests */
  readonly headers?: Record<string, string> | undefined;
  /** TCP address for WebSocket transport */
  readonly tcp?: string | undefined;
  /** Connection timeout in milliseconds */
  readonly timeout?: number | undefined;
  /** Whether this MCP server is trusted for automatic execution */
  readonly trust?: boolean | undefined;
  /** Human-readable description of the MCP server's purpose */
  readonly description?: string | undefined;
  /** Specific tools to include from this server (whitelist) */
  readonly includeTools?: string[] | undefined;
  /** Specific tools to exclude from this server (blacklist) */
  readonly excludeTools?: string[] | undefined;
  /** Name of the extension that provides this MCP server */
  readonly extensionName?: string | undefined;
  /** OAuth configuration for authenticated MCP servers */
  readonly oauth?: MCPOAuthConfig | undefined;
  /** Type of authentication provider to use */
  readonly authProviderType?: AuthProviderType | undefined;
  constructor(
    /** Command to execute for stdio-based MCP servers */
    command?: string | undefined,
    /** Command line arguments for the MCP server process */
    args?: string[] | undefined,
    /** Environment variables to set for the MCP server process */
    env?: Record<string, string> | undefined,
    /** Working directory for the MCP server process */
    cwd?: string | undefined,
    /** URL for server-sent events transport */
    url?: string | undefined,
    /** URL for HTTP-based MCP communication */
    httpUrl?: string | undefined,
    /** HTTP headers to include in requests */
    headers?: Record<string, string> | undefined,
    /** TCP address for WebSocket transport */
    tcp?: string | undefined,
    /** Connection timeout in milliseconds */
    timeout?: number | undefined,
    /** Whether this MCP server is trusted for automatic execution */
    trust?: boolean | undefined,
    /** Human-readable description of the MCP server's purpose */
    description?: string | undefined,
    /** Specific tools to include from this server (whitelist) */
    includeTools?: string[] | undefined,
    /** Specific tools to exclude from this server (blacklist) */
    excludeTools?: string[] | undefined,
    /** Name of the extension that provides this MCP server */
    extensionName?: string | undefined,
    /** OAuth configuration for authenticated MCP servers */
    oauth?: MCPOAuthConfig | undefined,
    /** Type of authentication provider to use */
    authProviderType?: AuthProviderType | undefined,
  );
}
/**
 * Types of authentication providers supported for MCP server connections.
 * Determines how authentication credentials are obtained and managed.
 */
export declare enum AuthProviderType {
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
  blockedMcpServers?: Array<{
    name: string;
    extensionName: string;
  }>;
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
export declare class Config {
  private toolRegistry;
  private promptRegistry;
  private readonly sessionId;
  private fileSystemService;
  private contentGeneratorConfig;
  private contentGenerator;
  private readonly embeddingModel;
  private readonly sandbox;
  private readonly targetDir;
  private workspaceContext;
  private readonly debugMode;
  private readonly question;
  private readonly fullContext;
  private readonly coreTools;
  private readonly allowedTools;
  private readonly excludeTools;
  private readonly toolDiscoveryCommand;
  private readonly toolCallCommand;
  private readonly mcpServerCommand;
  private readonly mcpServers;
  private userMemory;
  private geminiMdFileCount;
  private approvalMode;
  private readonly showMemoryUsage;
  private readonly accessibility;
  private readonly telemetrySettings;
  private readonly usageStatisticsEnabled;
  private geminiClient;
  private baseLlmClient;
  private modelRouterService;
  private readonly fileFiltering;
  private fileDiscoveryService;
  private gitService;
  private readonly checkpointing;
  private readonly proxy;
  private readonly cwd;
  private readonly bugCommand;
  private model;
  private readonly extensionContextFilePaths;
  private readonly noBrowser;
  private readonly folderTrustFeature;
  private readonly folderTrust;
  private ideMode;
  private inFallbackMode;
  private readonly maxSessionTurns;
  private readonly listExtensions;
  private readonly _extensions;
  private readonly _blockedMcpServers;
  fallbackModelHandler?: FallbackModelHandler;
  private quotaErrorOccurred;
  private readonly summarizeToolOutput;
  private readonly experimentalZedIntegration;
  private readonly loadMemoryFromIncludeDirectories;
  private readonly chatCompression;
  private readonly interactive;
  private readonly trustedFolder;
  private readonly useRipgrep;
  private readonly shouldUseNodePtyShell;
  private readonly skipNextSpeakerCheck;
  private shellExecutionConfig;
  private readonly extensionManagement;
  private readonly enablePromptCompletion;
  private readonly truncateToolOutputThreshold;
  private readonly truncateToolOutputLines;
  private readonly enableToolOutputTruncation;
  private initialized;
  readonly storage: Storage;
  private readonly fileExclusions;
  private readonly eventEmitter?;
  private readonly useSmartEdit;
  private readonly useWriteTodos;
  private readonly messageBus;
  private readonly policyEngine;
  private readonly outputSettings;
  private readonly useModelRouter;
  private readonly enableMessageBusIntegration;
  /**
   * Creates a new Config instance with the provided parameters.
   * Performs synchronous initialization of configuration properties.
   * Call initialize() after construction for async setup.
   *
   * @param params - Complete configuration parameters
   */
  constructor(params: ConfigParameters);
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
  initialize(): Promise<void>;
  getContentGenerator(): ContentGenerator;
  refreshAuth(authMethod: AuthType): Promise<void>;
  getUserTier(): UserTierId | undefined;
  /**
   * Provides access to the BaseLlmClient for stateless LLM operations.
   */
  getBaseLlmClient(): BaseLlmClient;
  getSessionId(): string;
  shouldLoadMemoryFromIncludeDirectories(): boolean;
  getContentGeneratorConfig(): ContentGeneratorConfig;
  getModel(): string;
  setModel(newModel: string): void;
  isInFallbackMode(): boolean;
  setFallbackMode(active: boolean): void;
  setFallbackModelHandler(handler: FallbackModelHandler): void;
  getMaxSessionTurns(): number;
  setQuotaErrorOccurred(value: boolean): void;
  getQuotaErrorOccurred(): boolean;
  getEmbeddingModel(): string;
  getSandbox(): SandboxConfig | undefined;
  isRestrictiveSandbox(): boolean;
  getTargetDir(): string;
  getProjectRoot(): string;
  getWorkspaceContext(): WorkspaceContext;
  getToolRegistry(): ToolRegistry;
  getPromptRegistry(): PromptRegistry;
  getDebugMode(): boolean;
  getQuestion(): string | undefined;
  getFullContext(): boolean;
  getCoreTools(): string[] | undefined;
  getAllowedTools(): string[] | undefined;
  getExcludeTools(): string[] | undefined;
  getToolDiscoveryCommand(): string | undefined;
  getToolCallCommand(): string | undefined;
  getMcpServerCommand(): string | undefined;
  getMcpServers(): Record<string, MCPServerConfig> | undefined;
  getUserMemory(): string;
  setUserMemory(newUserMemory: string): void;
  getGeminiMdFileCount(): number;
  setGeminiMdFileCount(count: number): void;
  getApprovalMode(): ApprovalMode;
  setApprovalMode(mode: ApprovalMode): void;
  getShowMemoryUsage(): boolean;
  getAccessibility(): AccessibilitySettings;
  getTelemetryEnabled(): boolean;
  getTelemetryLogPromptsEnabled(): boolean;
  getTelemetryOtlpEndpoint(): string;
  getTelemetryOtlpProtocol(): 'grpc' | 'http';
  getTelemetryTarget(): TelemetryTarget;
  getTelemetryOutfile(): string | undefined;
  getTelemetryUseCollector(): boolean;
  getGeminiClient(): GeminiClient;
  getModelRouterService(): ModelRouterService;
  getEnableRecursiveFileSearch(): boolean;
  getFileFilteringDisableFuzzySearch(): boolean;
  getFileFilteringRespectGitIgnore(): boolean;
  getFileFilteringRespectGeminiIgnore(): boolean;
  getFileFilteringOptions(): FileFilteringOptions;
  /**
   * Gets custom file exclusion patterns from configuration.
   * TODO: This is a placeholder implementation. In the future, this could
   * read from settings files, CLI arguments, or environment variables.
   */
  getCustomExcludes(): string[];
  getCheckpointingEnabled(): boolean;
  getProxy(): string | undefined;
  getWorkingDir(): string;
  getBugCommand(): BugCommandSettings | undefined;
  getFileService(): FileDiscoveryService;
  getUsageStatisticsEnabled(): boolean;
  getExtensionContextFilePaths(): string[];
  getExperimentalZedIntegration(): boolean;
  getListExtensions(): boolean;
  getExtensionManagement(): boolean;
  getExtensions(): GeminiCLIExtension[];
  getBlockedMcpServers(): Array<{
    name: string;
    extensionName: string;
  }>;
  getNoBrowser(): boolean;
  isBrowserLaunchSuppressed(): boolean;
  getSummarizeToolOutputConfig():
    | Record<string, SummarizeToolOutputSettings>
    | undefined;
  getIdeMode(): boolean;
  getFolderTrustFeature(): boolean;
  /**
   * Returns 'true' if the workspace is considered "trusted".
   * 'false' for untrusted.
   */
  getFolderTrust(): boolean;
  isTrustedFolder(): boolean;
  setIdeMode(value: boolean): void;
  /**
   * Get the current FileSystemService
   */
  getFileSystemService(): FileSystemService;
  /**
   * Set a custom FileSystemService
   */
  setFileSystemService(fileSystemService: FileSystemService): void;
  getChatCompression(): ChatCompressionSettings | undefined;
  isInteractive(): boolean;
  getUseRipgrep(): boolean;
  getShouldUseNodePtyShell(): boolean;
  getSkipNextSpeakerCheck(): boolean;
  getShellExecutionConfig(): ShellExecutionConfig;
  setShellExecutionConfig(config: ShellExecutionConfig): void;
  getScreenReader(): boolean;
  getEnablePromptCompletion(): boolean;
  getEnableToolOutputTruncation(): boolean;
  getTruncateToolOutputThreshold(): number;
  getTruncateToolOutputLines(): number;
  getUseSmartEdit(): boolean;
  getUseWriteTodos(): boolean;
  getOutputFormat(): OutputFormat;
  getUseModelRouter(): boolean;
  getGitService(): Promise<GitService>;
  getFileExclusions(): FileExclusions;
  getMessageBus(): MessageBus;
  getPolicyEngine(): PolicyEngine;
  getEnableMessageBusIntegration(): boolean;
  createToolRegistry(): Promise<ToolRegistry>;
}
export { DEFAULT_GEMINI_FLASH_MODEL };
