/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  MCPServerConfig,
  BugCommandSettings,
  TelemetrySettings,
  AuthType,
  ChatCompressionSettings,
} from '@google/gemini-cli-core';
import {
  DEFAULT_TRUNCATE_TOOL_OUTPUT_LINES,
  DEFAULT_TRUNCATE_TOOL_OUTPUT_THRESHOLD,
} from '@google/gemini-cli-core';
import type { CustomTheme } from '../ui/themes/theme.js';

/**
 * Enumeration of supported setting data types for configuration schema validation.
 * These types determine how settings are validated, stored, and displayed in the UI.
 */
export type SettingsType =
  | 'boolean'
  | 'string'
  | 'number'
  | 'array'
  | 'object'
  | 'enum';

/**
 * Union type representing all possible values that can be stored in application settings.
 * Supports primitive types, arrays, objects, and undefined for optional settings.
 */
export type SettingsValue =
  | boolean
  | string
  | number
  | string[]
  | object
  | undefined;

/**
 * Setting datatypes that "toggle" through a fixed list of options
 * (e.g. an enum or true/false) rather than allowing for free form input
 * (like a number or string).
 */
export const TOGGLE_TYPES: ReadonlySet<SettingsType | undefined> = new Set([
  'boolean',
  'enum',
]);

/**
 * Configuration option for enumeration-type settings that have predefined choices.
 * Used to define the available options and their display labels in the UI.
 *
 * @example
 * ```typescript
 * const outputOptions: SettingEnumOption[] = [
 *   { value: 'text', label: 'Text' },
 *   { value: 'json', label: 'JSON' }
 * ];
 * ```
 */
export interface SettingEnumOption {
  /** The actual value stored when this option is selected */
  value: string | number;
  /** Human-readable label displayed in the UI for this option */
  label: string;
}

/**
 * Strategies for merging configuration values when combining settings from multiple sources
 * (system defaults, user settings, workspace settings, etc.).
 * Determines how conflicts between different configuration scopes are resolved.
 */
export enum MergeStrategy {
  /** Replace the old value with the new value completely. This is the default behavior. */
  REPLACE = 'replace',
  /** Concatenate arrays, preserving order and allowing duplicates. */
  CONCAT = 'concat',
  /** Merge arrays while ensuring unique values (set union operation). */
  UNION = 'union',
  /** Perform shallow merge for objects, where new properties are added and existing ones are overwritten. */
  SHALLOW_MERGE = 'shallow_merge',
}

/**
 * Complete definition of a single configuration setting including its behavior,
 * validation rules, UI presentation, and merge strategy.
 *
 * @example
 * ```typescript
 * const vimModeSetting: SettingDefinition = {
 *   type: 'boolean',
 *   label: 'Vim Mode',
 *   category: 'General',
 *   requiresRestart: false,
 *   default: false,
 *   description: 'Enable Vim keybindings',
 *   showInDialog: true
 * };
 * ```
 */
export interface SettingDefinition {
  /** Data type of the setting value, determines validation and UI input type */
  type: SettingsType;
  /** Human-readable display name for the setting in UI */
  label: string;
  /** Category grouping for organizing settings in the UI */
  category: string;
  /** Whether changing this setting requires application restart to take effect */
  requiresRestart: boolean;
  /** Default value when no user preference is set */
  default: SettingsValue;
  /** Optional detailed description explaining the setting's purpose and behavior */
  description?: string;
  /** Parent key path for nested settings hierarchy */
  parentKey?: string;
  /** Child key for nested settings */
  childKey?: string;
  /** Unique identifier for the setting */
  key?: string;
  /** Nested schema for object-type settings containing sub-properties */
  properties?: SettingsSchema;
  /** Whether to display this setting in configuration dialogs */
  showInDialog?: boolean;
  /** Strategy for merging values from different configuration sources */
  mergeStrategy?: MergeStrategy;
  /** Available options for enum-type settings */
  options?: readonly SettingEnumOption[];
}

/**
 * Schema definition mapping setting keys to their complete configuration definitions.
 * Forms the structural blueprint for all application settings and their behavior.
 * Used for validation, UI generation, and settings management throughout the application.
 */
export interface SettingsSchema {
  [key: string]: SettingDefinition;
}

/**
 * Format options for importing context memory files into the application.
 * Determines how directory structures and file relationships are represented.
 */
export type MemoryImportFormat = 'tree' | 'flat';
/**
 * DNS resolution ordering preference for network operations.
 * Controls how domain names are resolved to IP addresses.
 */
export type DnsResolutionOrder = 'ipv4first' | 'verbatim';

/**
 * Configuration for daily API usage budget tracking and enforcement.
 * Helps users monitor and control their API consumption to avoid unexpected costs.
 *
 * @example
 * ```typescript
 * const budget: BudgetSettings = {
 *   enabled: true,
 *   dailyLimit: 100,
 *   resetTime: '00:00',
 *   warningThresholds: [50, 75, 90]
 * };
 * ```
 */
export interface BudgetSettings {
  /** Whether budget tracking and enforcement is active */
  enabled?: boolean;
  /** Maximum number of API requests allowed per day */
  dailyLimit?: number;
  /** Time when daily budget resets in HH:MM format (24-hour time) */
  resetTime?: string;
  /** Percentage thresholds at which to show usage warnings (e.g., [50, 75, 90]) */
  warningThresholds?: number[];
}

/**
 * Runtime tracking data for API usage budget monitoring.
 * Stores current usage statistics and warning states for the current budget period.
 */
export interface BudgetUsageData {
  /** Date of the current budget period in ISO format */
  date: string;
  /** Number of API requests made in the current budget period */
  requestCount: number;
  /** Timestamp of the last budget reset in ISO format */
  lastResetTime: string;
  /** List of warning threshold percentages that have already been shown to the user */
  warningsShown: number[];
}

/**
 * The canonical schema for all settings.
 * The structure of this object defines the structure of the `Settings` type.
 * `as const` is crucial for TypeScript to infer the most specific types possible.
 */
const SETTINGS_SCHEMA = {
  // Maintained for compatibility/criticality
  mcpServers: {
    type: 'object',
    label: 'MCP Servers',
    category: 'Advanced',
    requiresRestart: true,
    default: Object.create(null) as Record<string, MCPServerConfig>,
    description: 'Configuration for MCP servers.',
    showInDialog: false,
    mergeStrategy: MergeStrategy.SHALLOW_MERGE,
  },

  general: {
    type: 'object',
    label: 'General',
    category: 'General',
    requiresRestart: false,
    default: Object.create(null) as Record<string, unknown>,
    description: 'General application settings.',
    showInDialog: false,
    properties: {
      preferredEditor: {
        type: 'string',
        label: 'Preferred Editor',
        category: 'General',
        requiresRestart: false,
        default: undefined as string | undefined,
        description: 'The preferred editor to open files in.',
        showInDialog: false,
      },
      vimMode: {
        type: 'boolean',
        label: 'Vim Mode',
        category: 'General',
        requiresRestart: false,
        default: false,
        description: 'Enable Vim keybindings',
        showInDialog: true,
      },
      disableAutoUpdate: {
        type: 'boolean',
        label: 'Disable Auto Update',
        category: 'General',
        requiresRestart: false,
        default: false,
        description: 'Disable automatic updates',
        showInDialog: true,
      },
      disableUpdateNag: {
        type: 'boolean',
        label: 'Disable Update Nag',
        category: 'General',
        requiresRestart: false,
        default: false,
        description: 'Disable update notification prompts.',
        showInDialog: false,
      },
      checkpointing: {
        type: 'object',
        label: 'Checkpointing',
        category: 'General',
        requiresRestart: true,
        default: Object.create(null) as Record<string, unknown>,
        description: 'Session checkpointing settings.',
        showInDialog: false,
        properties: {
          enabled: {
            type: 'boolean',
            label: 'Enable Checkpointing',
            category: 'General',
            requiresRestart: true,
            default: false,
            description: 'Enable session checkpointing for recovery',
            showInDialog: false,
          },
        },
      },
      enablePromptCompletion: {
        type: 'boolean',
        label: 'Enable Prompt Completion',
        category: 'General',
        requiresRestart: true,
        default: false,
        description:
          'Enable AI-powered prompt completion suggestions while typing.',
        showInDialog: true,
      },
      debugKeystrokeLogging: {
        type: 'boolean',
        label: 'Debug Keystroke Logging',
        category: 'General',
        requiresRestart: false,
        default: false,
        description: 'Enable debug logging of keystrokes to the console.',
        showInDialog: true,
      },
    },
  },
  output: {
    type: 'object',
    label: 'Output',
    category: 'General',
    requiresRestart: false,
    default: Object.create(null) as Record<string, unknown>,
    description: 'Settings for the CLI output.',
    showInDialog: false,
    properties: {
      format: {
        type: 'enum',
        label: 'Output Format',
        category: 'General',
        requiresRestart: false,
        default: 'text',
        description: 'The format of the CLI output.',
        showInDialog: true,
        options: [
          { value: 'text', label: 'Text' },
          { value: 'json', label: 'JSON' },
        ],
      },
    },
  },

  ui: {
    type: 'object',
    label: 'UI',
    category: 'UI',
    requiresRestart: false,
    default: Object.create(null) as Record<string, unknown>,
    description: 'User interface settings.',
    showInDialog: false,
    properties: {
      theme: {
        type: 'string',
        label: 'Theme',
        category: 'UI',
        requiresRestart: false,
        default: undefined as string | undefined,
        description: 'The color theme for the UI.',
        showInDialog: false,
      },
      customThemes: {
        type: 'object',
        label: 'Custom Themes',
        category: 'UI',
        requiresRestart: false,
        default: Object.create(null) as Record<string, CustomTheme>,
        description: 'Custom theme definitions.',
        showInDialog: false,
      },
      hideWindowTitle: {
        type: 'boolean',
        label: 'Hide Window Title',
        category: 'UI',
        requiresRestart: true,
        default: false,
        description: 'Hide the window title bar',
        showInDialog: true,
      },
      hideTips: {
        type: 'boolean',
        label: 'Hide Tips',
        category: 'UI',
        requiresRestart: false,
        default: false,
        description: 'Hide helpful tips in the UI',
        showInDialog: true,
      },
      hideBanner: {
        type: 'boolean',
        label: 'Hide Banner',
        category: 'UI',
        requiresRestart: false,
        default: false,
        description: 'Hide the application banner',
        showInDialog: true,
      },
      hideContextSummary: {
        type: 'boolean',
        label: 'Hide Context Summary',
        category: 'UI',
        requiresRestart: false,
        default: false,
        description:
          'Hide the context summary (GEMINI.md, MCP servers) above the input.',
        showInDialog: true,
      },
      footer: {
        type: 'object',
        label: 'Footer',
        category: 'UI',
        requiresRestart: false,
        default: Object.create(null) as Record<string, unknown>,
        description: 'Settings for the footer.',
        showInDialog: false,
        properties: {
          hideCWD: {
            type: 'boolean',
            label: 'Hide CWD',
            category: 'UI',
            requiresRestart: false,
            default: false,
            description:
              'Hide the current working directory path in the footer.',
            showInDialog: true,
          },
          hideSandboxStatus: {
            type: 'boolean',
            label: 'Hide Sandbox Status',
            category: 'UI',
            requiresRestart: false,
            default: false,
            description: 'Hide the sandbox status indicator in the footer.',
            showInDialog: true,
          },
          hideModelInfo: {
            type: 'boolean',
            label: 'Hide Model Info',
            category: 'UI',
            requiresRestart: false,
            default: false,
            description: 'Hide the model name and context usage in the footer.',
            showInDialog: true,
          },
        },
      },
      hideFooter: {
        type: 'boolean',
        label: 'Hide Footer',
        category: 'UI',
        requiresRestart: false,
        default: false,
        description: 'Hide the footer from the UI',
        showInDialog: true,
      },
      showMemoryUsage: {
        type: 'boolean',
        label: 'Show Memory Usage',
        category: 'UI',
        requiresRestart: false,
        default: false,
        description: 'Display memory usage information in the UI',
        showInDialog: true,
      },
      showLineNumbers: {
        type: 'boolean',
        label: 'Show Line Numbers',
        category: 'UI',
        requiresRestart: false,
        default: false,
        description: 'Show line numbers in the chat.',
        showInDialog: true,
      },
      showCitations: {
        type: 'boolean',
        label: 'Show Citations',
        category: 'UI',
        requiresRestart: false,
        default: false,
        description: 'Show citations for generated text in the chat.',
        showInDialog: true,
      },
      customWittyPhrases: {
        type: 'array',
        label: 'Custom Witty Phrases',
        category: 'UI',
        requiresRestart: false,
        default: [] as string[],
        description: 'Custom witty phrases to display during loading.',
        showInDialog: false,
      },
      accessibility: {
        type: 'object',
        label: 'Accessibility',
        category: 'UI',
        requiresRestart: true,
        default: Object.create(null) as Record<string, unknown>,
        description: 'Accessibility settings.',
        showInDialog: false,
        properties: {
          disableLoadingPhrases: {
            type: 'boolean',
            label: 'Disable Loading Phrases',
            category: 'UI',
            requiresRestart: true,
            default: false,
            description: 'Disable loading phrases for accessibility',
            showInDialog: true,
          },
          screenReader: {
            type: 'boolean',
            label: 'Screen Reader Mode',
            category: 'UI',
            requiresRestart: true,
            default: undefined as boolean | undefined,
            description:
              'Render output in plain-text to be more screen reader accessible',
            showInDialog: true,
          },
        },
      },
    },
  },

  ide: {
    type: 'object',
    label: 'IDE',
    category: 'IDE',
    requiresRestart: true,
    default: Object.create(null) as Record<string, unknown>,
    description: 'IDE integration settings.',
    showInDialog: false,
    properties: {
      enabled: {
        type: 'boolean',
        label: 'IDE Mode',
        category: 'IDE',
        requiresRestart: true,
        default: false,
        description: 'Enable IDE integration mode',
        showInDialog: true,
      },
      hasSeenNudge: {
        type: 'boolean',
        label: 'Has Seen IDE Integration Nudge',
        category: 'IDE',
        requiresRestart: false,
        default: false,
        description: 'Whether the user has seen the IDE integration nudge.',
        showInDialog: false,
      },
    },
  },

  privacy: {
    type: 'object',
    label: 'Privacy',
    category: 'Privacy',
    requiresRestart: true,
    default: Object.create(null) as Record<string, unknown>,
    description: 'Privacy-related settings.',
    showInDialog: false,
    properties: {
      usageStatisticsEnabled: {
        type: 'boolean',
        label: 'Enable Usage Statistics',
        category: 'Privacy',
        requiresRestart: true,
        default: true,
        description: 'Enable collection of usage statistics',
        showInDialog: false,
      },
    },
  },

  telemetry: {
    type: 'object',
    label: 'Telemetry',
    category: 'Advanced',
    requiresRestart: true,
    default: undefined as TelemetrySettings | undefined,
    description: 'Telemetry configuration.',
    showInDialog: false,
  },

  model: {
    type: 'object',
    label: 'Model',
    category: 'Model',
    requiresRestart: false,
    default: Object.create(null) as Record<string, unknown>,
    description: 'Settings related to the generative model.',
    showInDialog: false,
    properties: {
      name: {
        type: 'enum',
        label: 'Model',
        category: 'Model',
        requiresRestart: false,
        default: 'auto',
        description:
          'The Gemini model to use for conversations. Auto enables intelligent model selection based on task complexity.',
        showInDialog: true,
        options: [
          { value: 'auto', label: 'Auto (Smart Selection)' },
          { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
          { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
          { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
        ],
      },
      maxSessionTurns: {
        type: 'number',
        label: 'Max Session Turns',
        category: 'Model',
        requiresRestart: false,
        default: -1,
        description:
          'Maximum number of user/model/tool turns to keep in a session. -1 means unlimited.',
        showInDialog: true,
      },
      summarizeToolOutput: {
        type: 'object',
        label: 'Summarize Tool Output',
        category: 'Model',
        requiresRestart: false,
        default: undefined as
          | Record<string, { tokenBudget?: number }>
          | undefined,
        description: 'Settings for summarizing tool output.',
        showInDialog: false,
      },
      chatCompression: {
        type: 'object',
        label: 'Chat Compression',
        category: 'Model',
        requiresRestart: false,
        default: undefined as ChatCompressionSettings | undefined,
        description: 'Chat compression settings.',
        showInDialog: false,
      },
      skipNextSpeakerCheck: {
        type: 'boolean',
        label: 'Skip Next Speaker Check',
        category: 'Model',
        requiresRestart: false,
        default: true,
        description: 'Skip the next speaker check.',
        showInDialog: true,
      },
      flashFirst: {
        type: 'object',
        label: 'Flash-First Smart Routing',
        category: 'Model',
        requiresRestart: false,
        default: Object.create(null) as Record<string, unknown>,
        description:
          'Settings for Flash-first smart model routing that defaults to cost-effective Flash model and escalates to Pro only when necessary.',
        showInDialog: false,
        properties: {
          enabled: {
            type: 'boolean',
            label: 'Enable Flash-First Mode',
            category: 'Model',
            requiresRestart: false,
            default: true,
            description:
              'Enable Flash-first routing that defaults to gemini-2.5-flash and escalates to gemini-2.5-pro only when Flash fails or is inadequate.',
            showInDialog: true,
          },
          failureThreshold: {
            type: 'number',
            label: 'Failure Escalation Threshold',
            category: 'Model',
            requiresRestart: false,
            default: 2,
            description:
              'Number of Flash model failures before automatically escalating similar requests to Pro model.',
            showInDialog: true,
          },
          timeoutThreshold: {
            type: 'number',
            label: 'Timeout Threshold (ms)',
            category: 'Model',
            requiresRestart: false,
            default: 30000,
            description:
              'Maximum time in milliseconds to wait for Flash model before considering it too slow (30 seconds default).',
            showInDialog: true,
          },
          enableSessionMemory: {
            type: 'boolean',
            label: 'Remember Escalation Decisions',
            category: 'Model',
            requiresRestart: false,
            default: true,
            description:
              'Remember escalation patterns during the session to avoid repeated Flash failures for similar requests.',
            showInDialog: true,
          },
          complexityBias: {
            type: 'enum',
            label: 'Complexity Classification Bias',
            category: 'Model',
            requiresRestart: false,
            default: 'flash-first',
            description:
              'How aggressively to favor Flash model in complexity classification.',
            showInDialog: true,
            options: [
              {
                value: 'flash-first',
                label: 'Flash-First (Aggressive Cost Savings)',
              },
              { value: 'balanced', label: 'Balanced' },
              { value: 'quality-first', label: 'Quality-First (Conservative)' },
            ],
          },
        },
      },
    },
  },

  context: {
    type: 'object',
    label: 'Context',
    category: 'Context',
    requiresRestart: false,
    default: Object.create(null) as Record<string, unknown>,
    description: 'Settings for managing context provided to the model.',
    showInDialog: false,
    properties: {
      fileName: {
        type: 'object',
        label: 'Context File Name',
        category: 'Context',
        requiresRestart: false,
        default: undefined as string | string[] | undefined,
        description: 'The name of the context file.',
        showInDialog: false,
      },
      importFormat: {
        type: 'string',
        label: 'Memory Import Format',
        category: 'Context',
        requiresRestart: false,
        default: undefined as MemoryImportFormat | undefined,
        description: 'The format to use when importing memory.',
        showInDialog: false,
      },
      discoveryMaxDirs: {
        type: 'number',
        label: 'Memory Discovery Max Dirs',
        category: 'Context',
        requiresRestart: false,
        default: 200,
        description: 'Maximum number of directories to search for memory.',
        showInDialog: true,
      },
      includeDirectories: {
        type: 'array',
        label: 'Include Directories',
        category: 'Context',
        requiresRestart: false,
        default: [] as string[],
        description:
          'Additional directories to include in the workspace context. Missing directories will be skipped with a warning.',
        showInDialog: false,
        mergeStrategy: MergeStrategy.CONCAT,
      },
      loadMemoryFromIncludeDirectories: {
        type: 'boolean',
        label: 'Load Memory From Include Directories',
        category: 'Context',
        requiresRestart: false,
        default: false,
        description: 'Whether to load memory files from include directories.',
        showInDialog: true,
      },
      fileFiltering: {
        type: 'object',
        label: 'File Filtering',
        category: 'Context',
        requiresRestart: true,
        default: Object.create(null) as Record<string, unknown>,
        description: 'Settings for git-aware file filtering.',
        showInDialog: false,
        properties: {
          respectGitIgnore: {
            type: 'boolean',
            label: 'Respect .gitignore',
            category: 'Context',
            requiresRestart: true,
            default: true,
            description: 'Respect .gitignore files when searching',
            showInDialog: true,
          },
          respectGeminiIgnore: {
            type: 'boolean',
            label: 'Respect .geminiignore',
            category: 'Context',
            requiresRestart: true,
            default: true,
            description: 'Respect .geminiignore files when searching',
            showInDialog: true,
          },
          enableRecursiveFileSearch: {
            type: 'boolean',
            label: 'Enable Recursive File Search',
            category: 'Context',
            requiresRestart: true,
            default: true,
            description: 'Enable recursive file search functionality',
            showInDialog: true,
          },
          disableFuzzySearch: {
            type: 'boolean',
            label: 'Disable Fuzzy Search',
            category: 'Context',
            requiresRestart: true,
            default: false,
            description: 'Disable fuzzy search when searching for files.',
            showInDialog: true,
          },
        },
      },
    },
  },

  tools: {
    type: 'object',
    label: 'Tools',
    category: 'Tools',
    requiresRestart: true,
    default: Object.create(null) as Record<string, unknown>,
    description: 'Settings for built-in and custom tools.',
    showInDialog: false,
    properties: {
      sandbox: {
        type: 'object',
        label: 'Sandbox',
        category: 'Tools',
        requiresRestart: true,
        default: undefined as boolean | string | undefined,
        description:
          'Sandbox execution environment (can be a boolean or a path string).',
        showInDialog: false,
      },
      shell: {
        type: 'object',
        label: 'Shell',
        category: 'Tools',
        requiresRestart: false,
        default: Object.create(null) as Record<string, unknown>,
        description: 'Settings for shell execution.',
        showInDialog: false,
        properties: {
          enableInteractiveShell: {
            type: 'boolean',
            label: 'Enable Interactive Shell',
            category: 'Tools',
            requiresRestart: true,
            default: false,
            description:
              'Use node-pty for an interactive shell experience. Fallback to child_process still applies.',
            showInDialog: true,
          },
          pager: {
            type: 'string',
            label: 'Pager',
            category: 'Tools',
            requiresRestart: false,
            default: 'cat' as string | undefined,
            description:
              'The pager command to use for shell output. Defaults to `cat`.',
            showInDialog: false,
          },
          showColor: {
            type: 'boolean',
            label: 'Show Color',
            category: 'Tools',
            requiresRestart: false,
            default: false,
            description: 'Show color in shell output.',
            showInDialog: true,
          },
        },
      },
      autoAccept: {
        type: 'boolean',
        label: 'Auto Accept',
        category: 'Tools',
        requiresRestart: false,
        default: false,
        description:
          'Automatically accept and execute tool calls that are considered safe (e.g., read-only operations).',
        showInDialog: true,
      },
      core: {
        type: 'array',
        label: 'Core Tools',
        category: 'Tools',
        requiresRestart: true,
        default: undefined as string[] | undefined,
        description: 'Paths to core tool definitions.',
        showInDialog: false,
      },
      allowed: {
        type: 'array',
        label: 'Allowed Tools',
        category: 'Advanced',
        requiresRestart: true,
        default: undefined as string[] | undefined,
        description:
          'A list of tool names that will bypass the confirmation dialog.',
        showInDialog: false,
      },
      exclude: {
        type: 'array',
        label: 'Exclude Tools',
        category: 'Tools',
        requiresRestart: true,
        default: undefined as string[] | undefined,
        description: 'Tool names to exclude from discovery.',
        showInDialog: false,
        mergeStrategy: MergeStrategy.UNION,
      },
      discoveryCommand: {
        type: 'string',
        label: 'Tool Discovery Command',
        category: 'Tools',
        requiresRestart: true,
        default: undefined as string | undefined,
        description: 'Command to run for tool discovery.',
        showInDialog: false,
      },
      callCommand: {
        type: 'string',
        label: 'Tool Call Command',
        category: 'Tools',
        requiresRestart: true,
        default: undefined as string | undefined,
        description: 'Command to run for tool calls.',
        showInDialog: false,
      },
      useRipgrep: {
        type: 'boolean',
        label: 'Use Ripgrep',
        category: 'Tools',
        requiresRestart: false,
        default: true,
        description:
          'Use ripgrep for file content search instead of the fallback implementation. Provides faster search performance.',
        showInDialog: true,
      },
      enableToolOutputTruncation: {
        type: 'boolean',
        label: 'Enable Tool Output Truncation',
        category: 'General',
        requiresRestart: true,
        default: false,
        description: 'Enable truncation of large tool outputs.',
        showInDialog: true,
      },
      truncateToolOutputThreshold: {
        type: 'number',
        label: 'Tool Output Truncation Threshold',
        category: 'General',
        requiresRestart: true,
        default: DEFAULT_TRUNCATE_TOOL_OUTPUT_THRESHOLD,
        description:
          'Truncate tool output if it is larger than this many characters. Set to -1 to disable.',
        showInDialog: true,
      },
      truncateToolOutputLines: {
        type: 'number',
        label: 'Tool Output Truncation Lines',
        category: 'General',
        requiresRestart: true,
        default: DEFAULT_TRUNCATE_TOOL_OUTPUT_LINES,
        description: 'The number of lines to keep when truncating tool output.',
        showInDialog: true,
      },
      enableMessageBusIntegration: {
        type: 'boolean',
        label: 'Enable Message Bus Integration',
        category: 'Tools',
        requiresRestart: true,
        default: false,
        description:
          'Enable policy-based tool confirmation via message bus integration. When enabled, tools will automatically respect policy engine decisions (ALLOW/DENY/ASK_USER) without requiring individual tool implementations.',
        showInDialog: true,
      },
    },
  },

  mcp: {
    type: 'object',
    label: 'MCP',
    category: 'MCP',
    requiresRestart: true,
    default: Object.create(null) as Record<string, unknown>,
    description: 'Settings for Model Context Protocol (MCP) servers.',
    showInDialog: false,
    properties: {
      serverCommand: {
        type: 'string',
        label: 'MCP Server Command',
        category: 'MCP',
        requiresRestart: true,
        default: undefined as string | undefined,
        description: 'Command to start an MCP server.',
        showInDialog: false,
      },
      allowed: {
        type: 'array',
        label: 'Allow MCP Servers',
        category: 'MCP',
        requiresRestart: true,
        default: undefined as string[] | undefined,
        description: 'A list of MCP servers to allow.',
        showInDialog: false,
      },
      excluded: {
        type: 'array',
        label: 'Exclude MCP Servers',
        category: 'MCP',
        requiresRestart: true,
        default: undefined as string[] | undefined,
        description: 'A list of MCP servers to exclude.',
        showInDialog: false,
      },
    },
  },
  useSmartEdit: {
    type: 'boolean',
    label: 'Use Smart Edit',
    category: 'Advanced',
    requiresRestart: false,
    default: false,
    description: 'Enable the smart-edit tool instead of the replace tool.',
    showInDialog: false,
  },
  useWriteTodos: {
    type: 'boolean',
    label: 'Use Write Todos',
    category: 'Advanced',
    requiresRestart: false,
    default: false,
    description: 'Enable the write_todos_list tool.',
    showInDialog: false,
  },
  security: {
    type: 'object',
    label: 'Security',
    category: 'Security',
    requiresRestart: true,
    default: Object.create(null) as Record<string, unknown>,
    description: 'Security-related settings.',
    showInDialog: false,
    properties: {
      folderTrust: {
        type: 'object',
        label: 'Folder Trust',
        category: 'Security',
        requiresRestart: false,
        default: Object.create(null) as Record<string, unknown>,
        description: 'Settings for folder trust.',
        showInDialog: false,
        properties: {
          enabled: {
            type: 'boolean',
            label: 'Folder Trust',
            category: 'Security',
            requiresRestart: true,
            default: false,
            description: 'Setting to track whether Folder trust is enabled.',
            showInDialog: true,
          },
        },
      },
      auth: {
        type: 'object',
        label: 'Authentication',
        category: 'Security',
        requiresRestart: true,
        default: Object.create(null) as Record<string, unknown>,
        description: 'Authentication settings.',
        showInDialog: false,
        properties: {
          selectedType: {
            type: 'string',
            label: 'Selected Auth Type',
            category: 'Security',
            requiresRestart: true,
            default: undefined as AuthType | undefined,
            description: 'The currently selected authentication type.',
            showInDialog: false,
          },
          enforcedType: {
            type: 'string',
            label: 'Enforced Auth Type',
            category: 'Advanced',
            requiresRestart: true,
            default: undefined as AuthType | undefined,
            description:
              'The required auth type. If this does not match the selected auth type, the user will be prompted to re-authenticate.',
            showInDialog: false,
          },
          useExternal: {
            type: 'boolean',
            label: 'Use External Auth',
            category: 'Security',
            requiresRestart: true,
            default: undefined as boolean | undefined,
            description: 'Whether to use an external authentication flow.',
            showInDialog: false,
          },
        },
      },
    },
  },

  advanced: {
    type: 'object',
    label: 'Advanced',
    category: 'Advanced',
    requiresRestart: true,
    default: Object.create(null) as Record<string, unknown>,
    description: 'Advanced settings for power users.',
    showInDialog: false,
    properties: {
      autoConfigureMemory: {
        type: 'boolean',
        label: 'Auto Configure Max Old Space Size',
        category: 'Advanced',
        requiresRestart: true,
        default: false,
        description: 'Automatically configure Node.js memory limits',
        showInDialog: false,
      },
      dnsResolutionOrder: {
        type: 'string',
        label: 'DNS Resolution Order',
        category: 'Advanced',
        requiresRestart: true,
        default: undefined as DnsResolutionOrder | undefined,
        description: 'The DNS resolution order.',
        showInDialog: false,
      },
      excludedEnvVars: {
        type: 'array',
        label: 'Excluded Project Environment Variables',
        category: 'Advanced',
        requiresRestart: false,
        default: ['DEBUG', 'DEBUG_MODE'] as string[],
        description: 'Environment variables to exclude from project context.',
        showInDialog: false,
        mergeStrategy: MergeStrategy.UNION,
      },
      bugCommand: {
        type: 'object',
        label: 'Bug Command',
        category: 'Advanced',
        requiresRestart: false,
        default: undefined as BugCommandSettings | undefined,
        description: 'Configuration for the bug report command.',
        showInDialog: false,
      },
    },
  },

  experimental: {
    type: 'object',
    label: 'Experimental',
    category: 'Experimental',
    requiresRestart: true,
    default: Object.create(null) as Record<string, unknown>,
    description: 'Setting to enable experimental features',
    showInDialog: false,
    properties: {
      extensionManagement: {
        type: 'boolean',
        label: 'Extension Management',
        category: 'Experimental',
        requiresRestart: true,
        default: true,
        description: 'Enable extension management features.',
        showInDialog: false,
      },
      useModelRouter: {
        type: 'boolean',
        label: 'Enable Smart Model Routing',
        category: 'Model',
        requiresRestart: true,
        default: true,
        description:
          'Enable AI-powered model routing to automatically select the best model based on task complexity. Required for Auto model selection to work.',
        showInDialog: true,
      },
    },
  },

  budget: {
    type: 'object',
    label: 'Budget',
    category: 'Budget',
    requiresRestart: false,
    default: Object.create(null) as Record<string, unknown>,
    description: 'Daily usage budget settings for API requests.',
    showInDialog: true,
    properties: {
      enabled: {
        type: 'boolean',
        label: 'Enable Budget Tracking',
        category: 'Budget',
        requiresRestart: false,
        default: false,
        description: 'Enable daily budget tracking and enforcement.',
        showInDialog: true,
      },
      dailyLimit: {
        type: 'number',
        label: 'Daily Request Limit',
        category: 'Budget',
        requiresRestart: false,
        default: 100,
        description: 'Maximum number of API requests allowed per day.',
        showInDialog: true,
      },
      resetTime: {
        type: 'string',
        label: 'Budget Reset Time',
        category: 'Budget',
        requiresRestart: false,
        default: '00:00',
        description: 'Time of day when the daily budget resets (HH:MM format).',
        showInDialog: true,
      },
      warningThresholds: {
        type: 'array',
        label: 'Warning Thresholds',
        category: 'Budget',
        requiresRestart: false,
        default: [50, 75, 90] as number[],
        description: 'Percentage thresholds at which to show usage warnings.',
        showInDialog: false,
        mergeStrategy: MergeStrategy.REPLACE,
      },
    },
  },

  extensions: {
    type: 'object',
    label: 'Extensions',
    category: 'Extensions',
    requiresRestart: true,
    default: Object.create(null) as Record<string, unknown>,
    description: 'Settings for extensions.',
    showInDialog: false,
    properties: {
      disabled: {
        type: 'array',
        label: 'Disabled Extensions',
        category: 'Extensions',
        requiresRestart: true,
        default: [] as string[],
        description: 'List of disabled extensions.',
        showInDialog: false,
        mergeStrategy: MergeStrategy.UNION,
      },
      workspacesWithMigrationNudge: {
        type: 'array',
        label: 'Workspaces with Migration Nudge',
        category: 'Extensions',
        requiresRestart: false,
        default: [] as string[],
        description:
          'List of workspaces for which the migration nudge has been shown.',
        showInDialog: false,
        mergeStrategy: MergeStrategy.UNION,
      },
    },
  },

  persona: {
    type: 'object',
    label: 'AI Persona',
    category: 'Persona',
    requiresRestart: false,
    default: Object.create(null) as Record<string, unknown>,
    description: 'Customizable AI personality and behavior settings.',
    showInDialog: true,
    properties: {
      active: {
        type: 'string',
        label: 'Active Persona',
        category: 'Persona',
        requiresRestart: false,
        default: 'professional',
        description: 'Currently active persona profile.',
        showInDialog: true,
      },
      personality: {
        type: 'object',
        label: 'Personality Traits',
        category: 'Persona',
        requiresRestart: false,
        default: Object.create(null) as Record<string, unknown>,
        description: 'Core personality characteristics.',
        showInDialog: false,
        properties: {
          formality: {
            type: 'enum',
            label: 'Communication Style',
            category: 'Persona',
            requiresRestart: false,
            default: 'professional',
            description: 'How formal or casual the AI communication should be.',
            showInDialog: true,
            options: [
              { value: 'formal', label: 'Formal & Professional' },
              { value: 'professional', label: 'Professional & Friendly' },
              { value: 'casual', label: 'Casual & Conversational' },
              { value: 'relaxed', label: 'Relaxed & Informal' },
            ],
          },
          verbosity: {
            type: 'enum',
            label: 'Response Length',
            category: 'Persona',
            requiresRestart: false,
            default: 'balanced',
            description: 'How detailed and lengthy responses should be.',
            showInDialog: true,
            options: [
              { value: 'concise', label: 'Concise & Brief' },
              { value: 'balanced', label: 'Balanced Detail' },
              { value: 'detailed', label: 'Detailed & Thorough' },
              { value: 'comprehensive', label: 'Comprehensive & Extensive' },
            ],
          },
          creativity: {
            type: 'enum',
            label: 'Creativity Level',
            category: 'Persona',
            requiresRestart: false,
            default: 'practical',
            description: 'How creative and experimental the AI should be.',
            showInDialog: true,
            options: [
              { value: 'conservative', label: 'Conservative & Safe' },
              { value: 'practical', label: 'Practical & Reliable' },
              { value: 'innovative', label: 'Innovative & Creative' },
              { value: 'experimental', label: 'Experimental & Bold' },
            ],
          },
          teachingStyle: {
            type: 'enum',
            label: 'Teaching Approach',
            category: 'Persona',
            requiresRestart: false,
            default: 'explanatory',
            description: 'How the AI explains concepts and provides guidance.',
            showInDialog: true,
            options: [
              { value: 'direct', label: 'Direct & Solution-Focused' },
              { value: 'explanatory', label: 'Explanatory & Educational' },
              { value: 'socratic', label: 'Socratic & Question-Guided' },
              { value: 'mentoring', label: 'Mentoring & Supportive' },
            ],
          },
        },
      },
      behavior: {
        type: 'object',
        label: 'Behavioral Patterns',
        category: 'Persona',
        requiresRestart: false,
        default: Object.create(null) as Record<string, unknown>,
        description: 'How the AI behaves and interacts.',
        showInDialog: false,
        properties: {
          proactiveness: {
            type: 'enum',
            label: 'Proactiveness',
            category: 'Persona',
            requiresRestart: false,
            default: 'balanced',
            description:
              'How proactive the AI should be in suggesting improvements.',
            showInDialog: true,
            options: [
              { value: 'reactive', label: 'Reactive - Wait for Instructions' },
              { value: 'balanced', label: 'Balanced - Moderate Suggestions' },
              { value: 'proactive', label: 'Proactive - Suggest Improvements' },
              { value: 'assertive', label: 'Assertive - Drive Best Practices' },
            ],
          },
          errorHandling: {
            type: 'enum',
            label: 'Error Handling Style',
            category: 'Persona',
            requiresRestart: false,
            default: 'helpful',
            description: 'How the AI responds to and handles errors.',
            showInDialog: true,
            options: [
              { value: 'concise', label: 'Concise - Brief Error Messages' },
              { value: 'helpful', label: 'Helpful - Explain and Guide' },
              { value: 'thorough', label: 'Thorough - Deep Problem Analysis' },
              {
                value: 'preventive',
                label: 'Preventive - Focus on Prevention',
              },
            ],
          },
          codeStyle: {
            type: 'enum',
            label: 'Code Review Style',
            category: 'Persona',
            requiresRestart: false,
            default: 'constructive',
            description: 'How the AI approaches code review and suggestions.',
            showInDialog: true,
            options: [
              { value: 'minimal', label: 'Minimal - Essential Changes Only' },
              {
                value: 'constructive',
                label: 'Constructive - Balanced Feedback',
              },
              {
                value: 'comprehensive',
                label: 'Comprehensive - Detailed Review',
              },
              { value: 'mentoring', label: 'Mentoring - Teaching-Focused' },
            ],
          },
        },
      },
      customization: {
        type: 'object',
        label: 'Custom Preferences',
        category: 'Persona',
        requiresRestart: false,
        default: Object.create(null) as Record<string, unknown>,
        description: 'Advanced customization options.',
        showInDialog: false,
        properties: {
          preferredTerminology: {
            type: 'object',
            label: 'Preferred Terminology',
            category: 'Persona',
            requiresRestart: false,
            default: Object.create(null) as Record<string, string>,
            description: 'Custom terminology preferences for technical terms.',
            showInDialog: false,
          },
          customPromptAdditions: {
            type: 'string',
            label: 'Custom Prompt Additions',
            category: 'Persona',
            requiresRestart: false,
            default: '',
            description: 'Additional instructions to add to the system prompt.',
            showInDialog: true,
          },
          learningPreferences: {
            type: 'array',
            label: 'Learning Focus Areas',
            category: 'Persona',
            requiresRestart: false,
            default: [] as string[],
            description: 'Areas where you want the AI to focus on teaching.',
            showInDialog: false,
            mergeStrategy: MergeStrategy.UNION,
          },
        },
      },
      profiles: {
        type: 'object',
        label: 'Persona Profiles',
        category: 'Persona',
        requiresRestart: false,
        default: Object.create(null) as Record<string, PersonaProfile>,
        description: 'Saved persona configurations for quick switching.',
        showInDialog: false,
      },
    },
  },
} as const satisfies SettingsSchema;

/**
 * TypeScript type derived from the complete settings schema constant.
 * Provides compile-time type safety for all configuration operations.
 */
export type SettingsSchemaType = typeof SETTINGS_SCHEMA;

/**
 * Returns the complete settings schema definition for the application.
 * This schema defines all available configuration options, their types,
 * default values, validation rules, and UI presentation.
 *
 * @returns The complete settings schema containing all configuration definitions
 *
 * @example
 * ```typescript
 * const schema = getSettingsSchema();
 * const vimModeSetting = schema.general.properties?.vimMode;
 * console.log(vimModeSetting?.default); // false
 * ```
 */
export function getSettingsSchema(): SettingsSchemaType {
  return SETTINGS_SCHEMA;
}

/**
 * Advanced TypeScript utility type that infers the actual settings object structure
 * from the schema definition. Automatically generates the correct TypeScript types
 * for all settings based on their schema definitions.
 *
 * This type performs the following transformations:
 * - Removes readonly modifiers to allow settings modification
 * - Makes all properties optional since settings may not be set
 * - Recursively processes nested object properties
 * - Preserves the exact type structure defined in the schema
 */
type InferSettings<T extends SettingsSchema> = {
  -readonly [K in keyof T]?: T[K] extends { properties: SettingsSchema }
    ? InferSettings<T[K]['properties']>
    : T[K]['default'] extends boolean
      ? boolean
      : T[K]['default'];
};

/**
 * Main type representing the complete application settings object.
 * Automatically inferred from the settings schema to ensure type safety
 * and consistency between schema definitions and runtime settings.
 *
 * This type is used throughout the application for:
 * - Type-safe access to configuration values
 * - Settings validation and serialization
 * - IDE autocompletion and error checking
 *
 * @example
 * ```typescript
 * const settings: Settings = {
 *   general: {
 *     vimMode: true,
 *     preferredEditor: 'code'
 *   },
 *   ui: {
 *     theme: 'dark',
 *     hideFooter: false
 *   }
 * };
 * ```
 */
export type Settings = InferSettings<SettingsSchemaType>;

/**
 * Specific configuration options for the application footer display.
 * Controls the visibility of various information elements in the status bar.
 *
 * @example
 * ```typescript
 * const footerConfig: FooterSettings = {
 *   hideCWD: false,           // Show current working directory
 *   hideSandboxStatus: true,  // Hide sandbox status indicator
 *   hideModelInfo: false      // Show active model information
 * };
 * ```
 */
export interface FooterSettings {
  /** Whether to hide the current working directory path in the footer */
  hideCWD?: boolean;
  /** Whether to hide the sandbox execution status indicator */
  hideSandboxStatus?: boolean;
  /** Whether to hide the model name and context usage information */
  hideModelInfo?: boolean;
}

/**
 * Personality trait values for AI behavior customization.
 * Defines how the AI communicates and approaches different tasks.
 */
export interface PersonalityTraits {
  /** Communication formality level */
  formality?: 'formal' | 'professional' | 'casual' | 'relaxed';
  /** Response detail level */
  verbosity?: 'concise' | 'balanced' | 'detailed' | 'comprehensive';
  /** Creativity and innovation level */
  creativity?: 'conservative' | 'practical' | 'innovative' | 'experimental';
  /** Teaching and explanation approach */
  teachingStyle?: 'direct' | 'explanatory' | 'socratic' | 'mentoring';
}

/**
 * Behavioral patterns for AI interaction style.
 * Controls how the AI behaves in different situations.
 */
export interface BehavioralPatterns {
  /** How proactive the AI should be */
  proactiveness?: 'reactive' | 'balanced' | 'proactive' | 'assertive';
  /** Error handling approach */
  errorHandling?: 'concise' | 'helpful' | 'thorough' | 'preventive';
  /** Code review and feedback style */
  codeStyle?: 'minimal' | 'constructive' | 'comprehensive' | 'mentoring';
}

/**
 * Advanced customization options for persona behavior.
 * Allows fine-tuning of AI responses and terminology.
 */
export interface PersonaCustomization {
  /** Custom terminology mappings for technical terms */
  preferredTerminology?: Record<string, string>;
  /** Additional instructions to add to system prompt */
  customPromptAdditions?: string;
  /** Areas of focus for educational content */
  learningPreferences?: string[];
}

/**
 * Complete persona profile configuration.
 * Represents a saved set of personality, behavior, and customization preferences.
 *
 * @example
 * ```typescript
 * const mentorPersona: PersonaProfile = {
 *   name: 'Coding Mentor',
 *   description: 'Patient teacher focused on learning',
 *   personality: {
 *     formality: 'professional',
 *     verbosity: 'detailed',
 *     creativity: 'practical',
 *     teachingStyle: 'mentoring'
 *   },
 *   behavior: {
 *     proactiveness: 'proactive',
 *     errorHandling: 'thorough',
 *     codeStyle: 'mentoring'
 *   },
 *   customization: {
 *     learningPreferences: ['best-practices', 'security', 'performance']
 *   }
 * };
 * ```
 */
export interface PersonaProfile {
  /** Display name for the persona */
  name: string;
  /** Description of the persona's characteristics */
  description: string;
  /** Personality trait configuration */
  personality: PersonalityTraits;
  /** Behavioral pattern configuration */
  behavior: BehavioralPatterns;
  /** Advanced customization options */
  customization: PersonaCustomization;
  /** Whether this is a built-in system persona */
  isSystem?: boolean;
  /** Creation or last modification timestamp */
  updatedAt?: string;
}
