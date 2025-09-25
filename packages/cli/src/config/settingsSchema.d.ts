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
export declare const TOGGLE_TYPES: ReadonlySet<SettingsType | undefined>;
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
export declare enum MergeStrategy {
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
declare const SETTINGS_SCHEMA: {
  readonly mcpServers: {
    readonly type: 'object';
    readonly label: 'MCP Servers';
    readonly category: 'Advanced';
    readonly requiresRestart: true;
    readonly default: Record<string, MCPServerConfig>;
    readonly description: 'Configuration for MCP servers.';
    readonly showInDialog: false;
    readonly mergeStrategy: MergeStrategy.SHALLOW_MERGE;
  };
  readonly general: {
    readonly type: 'object';
    readonly label: 'General';
    readonly category: 'General';
    readonly requiresRestart: false;
    readonly default: {};
    readonly description: 'General application settings.';
    readonly showInDialog: false;
    readonly properties: {
      readonly preferredEditor: {
        readonly type: 'string';
        readonly label: 'Preferred Editor';
        readonly category: 'General';
        readonly requiresRestart: false;
        readonly default: string | undefined;
        readonly description: 'The preferred editor to open files in.';
        readonly showInDialog: false;
      };
      readonly vimMode: {
        readonly type: 'boolean';
        readonly label: 'Vim Mode';
        readonly category: 'General';
        readonly requiresRestart: false;
        readonly default: false;
        readonly description: 'Enable Vim keybindings';
        readonly showInDialog: true;
      };
      readonly disableAutoUpdate: {
        readonly type: 'boolean';
        readonly label: 'Disable Auto Update';
        readonly category: 'General';
        readonly requiresRestart: false;
        readonly default: false;
        readonly description: 'Disable automatic updates';
        readonly showInDialog: true;
      };
      readonly disableUpdateNag: {
        readonly type: 'boolean';
        readonly label: 'Disable Update Nag';
        readonly category: 'General';
        readonly requiresRestart: false;
        readonly default: false;
        readonly description: 'Disable update notification prompts.';
        readonly showInDialog: false;
      };
      readonly checkpointing: {
        readonly type: 'object';
        readonly label: 'Checkpointing';
        readonly category: 'General';
        readonly requiresRestart: true;
        readonly default: {};
        readonly description: 'Session checkpointing settings.';
        readonly showInDialog: false;
        readonly properties: {
          readonly enabled: {
            readonly type: 'boolean';
            readonly label: 'Enable Checkpointing';
            readonly category: 'General';
            readonly requiresRestart: true;
            readonly default: false;
            readonly description: 'Enable session checkpointing for recovery';
            readonly showInDialog: false;
          };
        };
      };
      readonly enablePromptCompletion: {
        readonly type: 'boolean';
        readonly label: 'Enable Prompt Completion';
        readonly category: 'General';
        readonly requiresRestart: true;
        readonly default: false;
        readonly description: 'Enable AI-powered prompt completion suggestions while typing.';
        readonly showInDialog: true;
      };
      readonly debugKeystrokeLogging: {
        readonly type: 'boolean';
        readonly label: 'Debug Keystroke Logging';
        readonly category: 'General';
        readonly requiresRestart: false;
        readonly default: false;
        readonly description: 'Enable debug logging of keystrokes to the console.';
        readonly showInDialog: true;
      };
    };
  };
  readonly output: {
    readonly type: 'object';
    readonly label: 'Output';
    readonly category: 'General';
    readonly requiresRestart: false;
    readonly default: {};
    readonly description: 'Settings for the CLI output.';
    readonly showInDialog: false;
    readonly properties: {
      readonly format: {
        readonly type: 'enum';
        readonly label: 'Output Format';
        readonly category: 'General';
        readonly requiresRestart: false;
        readonly default: 'text';
        readonly description: 'The format of the CLI output.';
        readonly showInDialog: true;
        readonly options: readonly [
          {
            readonly value: 'text';
            readonly label: 'Text';
          },
          {
            readonly value: 'json';
            readonly label: 'JSON';
          },
        ];
      };
    };
  };
  readonly ui: {
    readonly type: 'object';
    readonly label: 'UI';
    readonly category: 'UI';
    readonly requiresRestart: false;
    readonly default: {};
    readonly description: 'User interface settings.';
    readonly showInDialog: false;
    readonly properties: {
      readonly theme: {
        readonly type: 'string';
        readonly label: 'Theme';
        readonly category: 'UI';
        readonly requiresRestart: false;
        readonly default: string | undefined;
        readonly description: 'The color theme for the UI.';
        readonly showInDialog: false;
      };
      readonly customThemes: {
        readonly type: 'object';
        readonly label: 'Custom Themes';
        readonly category: 'UI';
        readonly requiresRestart: false;
        readonly default: Record<string, CustomTheme>;
        readonly description: 'Custom theme definitions.';
        readonly showInDialog: false;
      };
      readonly hideWindowTitle: {
        readonly type: 'boolean';
        readonly label: 'Hide Window Title';
        readonly category: 'UI';
        readonly requiresRestart: true;
        readonly default: false;
        readonly description: 'Hide the window title bar';
        readonly showInDialog: true;
      };
      readonly hideTips: {
        readonly type: 'boolean';
        readonly label: 'Hide Tips';
        readonly category: 'UI';
        readonly requiresRestart: false;
        readonly default: false;
        readonly description: 'Hide helpful tips in the UI';
        readonly showInDialog: true;
      };
      readonly hideBanner: {
        readonly type: 'boolean';
        readonly label: 'Hide Banner';
        readonly category: 'UI';
        readonly requiresRestart: false;
        readonly default: false;
        readonly description: 'Hide the application banner';
        readonly showInDialog: true;
      };
      readonly hideContextSummary: {
        readonly type: 'boolean';
        readonly label: 'Hide Context Summary';
        readonly category: 'UI';
        readonly requiresRestart: false;
        readonly default: false;
        readonly description: 'Hide the context summary (GEMINI.md, MCP servers) above the input.';
        readonly showInDialog: true;
      };
      readonly footer: {
        readonly type: 'object';
        readonly label: 'Footer';
        readonly category: 'UI';
        readonly requiresRestart: false;
        readonly default: {};
        readonly description: 'Settings for the footer.';
        readonly showInDialog: false;
        readonly properties: {
          readonly hideCWD: {
            readonly type: 'boolean';
            readonly label: 'Hide CWD';
            readonly category: 'UI';
            readonly requiresRestart: false;
            readonly default: false;
            readonly description: 'Hide the current working directory path in the footer.';
            readonly showInDialog: true;
          };
          readonly hideSandboxStatus: {
            readonly type: 'boolean';
            readonly label: 'Hide Sandbox Status';
            readonly category: 'UI';
            readonly requiresRestart: false;
            readonly default: false;
            readonly description: 'Hide the sandbox status indicator in the footer.';
            readonly showInDialog: true;
          };
          readonly hideModelInfo: {
            readonly type: 'boolean';
            readonly label: 'Hide Model Info';
            readonly category: 'UI';
            readonly requiresRestart: false;
            readonly default: false;
            readonly description: 'Hide the model name and context usage in the footer.';
            readonly showInDialog: true;
          };
        };
      };
      readonly hideFooter: {
        readonly type: 'boolean';
        readonly label: 'Hide Footer';
        readonly category: 'UI';
        readonly requiresRestart: false;
        readonly default: false;
        readonly description: 'Hide the footer from the UI';
        readonly showInDialog: true;
      };
      readonly showMemoryUsage: {
        readonly type: 'boolean';
        readonly label: 'Show Memory Usage';
        readonly category: 'UI';
        readonly requiresRestart: false;
        readonly default: false;
        readonly description: 'Display memory usage information in the UI';
        readonly showInDialog: true;
      };
      readonly showLineNumbers: {
        readonly type: 'boolean';
        readonly label: 'Show Line Numbers';
        readonly category: 'UI';
        readonly requiresRestart: false;
        readonly default: false;
        readonly description: 'Show line numbers in the chat.';
        readonly showInDialog: true;
      };
      readonly showCitations: {
        readonly type: 'boolean';
        readonly label: 'Show Citations';
        readonly category: 'UI';
        readonly requiresRestart: false;
        readonly default: false;
        readonly description: 'Show citations for generated text in the chat.';
        readonly showInDialog: true;
      };
      readonly customWittyPhrases: {
        readonly type: 'array';
        readonly label: 'Custom Witty Phrases';
        readonly category: 'UI';
        readonly requiresRestart: false;
        readonly default: string[];
        readonly description: 'Custom witty phrases to display during loading.';
        readonly showInDialog: false;
      };
      readonly accessibility: {
        readonly type: 'object';
        readonly label: 'Accessibility';
        readonly category: 'UI';
        readonly requiresRestart: true;
        readonly default: {};
        readonly description: 'Accessibility settings.';
        readonly showInDialog: false;
        readonly properties: {
          readonly disableLoadingPhrases: {
            readonly type: 'boolean';
            readonly label: 'Disable Loading Phrases';
            readonly category: 'UI';
            readonly requiresRestart: true;
            readonly default: false;
            readonly description: 'Disable loading phrases for accessibility';
            readonly showInDialog: true;
          };
          readonly screenReader: {
            readonly type: 'boolean';
            readonly label: 'Screen Reader Mode';
            readonly category: 'UI';
            readonly requiresRestart: true;
            readonly default: boolean | undefined;
            readonly description: 'Render output in plain-text to be more screen reader accessible';
            readonly showInDialog: true;
          };
        };
      };
    };
  };
  readonly ide: {
    readonly type: 'object';
    readonly label: 'IDE';
    readonly category: 'IDE';
    readonly requiresRestart: true;
    readonly default: {};
    readonly description: 'IDE integration settings.';
    readonly showInDialog: false;
    readonly properties: {
      readonly enabled: {
        readonly type: 'boolean';
        readonly label: 'IDE Mode';
        readonly category: 'IDE';
        readonly requiresRestart: true;
        readonly default: false;
        readonly description: 'Enable IDE integration mode';
        readonly showInDialog: true;
      };
      readonly hasSeenNudge: {
        readonly type: 'boolean';
        readonly label: 'Has Seen IDE Integration Nudge';
        readonly category: 'IDE';
        readonly requiresRestart: false;
        readonly default: false;
        readonly description: 'Whether the user has seen the IDE integration nudge.';
        readonly showInDialog: false;
      };
    };
  };
  readonly privacy: {
    readonly type: 'object';
    readonly label: 'Privacy';
    readonly category: 'Privacy';
    readonly requiresRestart: true;
    readonly default: {};
    readonly description: 'Privacy-related settings.';
    readonly showInDialog: false;
    readonly properties: {
      readonly usageStatisticsEnabled: {
        readonly type: 'boolean';
        readonly label: 'Enable Usage Statistics';
        readonly category: 'Privacy';
        readonly requiresRestart: true;
        readonly default: true;
        readonly description: 'Enable collection of usage statistics';
        readonly showInDialog: false;
      };
    };
  };
  readonly telemetry: {
    readonly type: 'object';
    readonly label: 'Telemetry';
    readonly category: 'Advanced';
    readonly requiresRestart: true;
    readonly default: TelemetrySettings | undefined;
    readonly description: 'Telemetry configuration.';
    readonly showInDialog: false;
  };
  readonly model: {
    readonly type: 'object';
    readonly label: 'Model';
    readonly category: 'Model';
    readonly requiresRestart: false;
    readonly default: {};
    readonly description: 'Settings related to the generative model.';
    readonly showInDialog: false;
    readonly properties: {
      readonly name: {
        readonly type: 'enum';
        readonly label: 'Model';
        readonly category: 'Model';
        readonly requiresRestart: false;
        readonly default: 'auto';
        readonly description: 'The Gemini model to use for conversations. Auto enables intelligent model selection based on task complexity.';
        readonly showInDialog: true;
        readonly options: readonly [
          {
            readonly value: 'auto';
            readonly label: 'Auto (Smart Selection)';
          },
          {
            readonly value: 'gemini-2.5-pro';
            readonly label: 'Gemini 2.5 Pro';
          },
          {
            readonly value: 'gemini-2.5-flash';
            readonly label: 'Gemini 2.5 Flash';
          },
          {
            readonly value: 'gemini-2.5-flash-lite';
            readonly label: 'Gemini 2.5 Flash Lite';
          },
        ];
      };
      readonly maxSessionTurns: {
        readonly type: 'number';
        readonly label: 'Max Session Turns';
        readonly category: 'Model';
        readonly requiresRestart: false;
        readonly default: -1;
        readonly description: 'Maximum number of user/model/tool turns to keep in a session. -1 means unlimited.';
        readonly showInDialog: true;
      };
      readonly summarizeToolOutput: {
        readonly type: 'object';
        readonly label: 'Summarize Tool Output';
        readonly category: 'Model';
        readonly requiresRestart: false;
        readonly default:
          | Record<
              string,
              {
                tokenBudget?: number;
              }
            >
          | undefined;
        readonly description: 'Settings for summarizing tool output.';
        readonly showInDialog: false;
      };
      readonly chatCompression: {
        readonly type: 'object';
        readonly label: 'Chat Compression';
        readonly category: 'Model';
        readonly requiresRestart: false;
        readonly default: ChatCompressionSettings | undefined;
        readonly description: 'Chat compression settings.';
        readonly showInDialog: false;
      };
      readonly skipNextSpeakerCheck: {
        readonly type: 'boolean';
        readonly label: 'Skip Next Speaker Check';
        readonly category: 'Model';
        readonly requiresRestart: false;
        readonly default: true;
        readonly description: 'Skip the next speaker check.';
        readonly showInDialog: true;
      };
      readonly flashFirst: {
        readonly type: 'object';
        readonly label: 'Flash-First Smart Routing';
        readonly category: 'Model';
        readonly requiresRestart: false;
        readonly default: {};
        readonly description: 'Settings for Flash-first smart model routing that defaults to cost-effective Flash model and escalates to Pro only when necessary.';
        readonly showInDialog: false;
        readonly properties: {
          readonly enabled: {
            readonly type: 'boolean';
            readonly label: 'Enable Flash-First Mode';
            readonly category: 'Model';
            readonly requiresRestart: false;
            readonly default: true;
            readonly description: 'Enable Flash-first routing that defaults to gemini-2.5-flash and escalates to gemini-2.5-pro only when Flash fails or is inadequate.';
            readonly showInDialog: true;
          };
          readonly failureThreshold: {
            readonly type: 'number';
            readonly label: 'Failure Escalation Threshold';
            readonly category: 'Model';
            readonly requiresRestart: false;
            readonly default: 2;
            readonly description: 'Number of Flash model failures before automatically escalating similar requests to Pro model.';
            readonly showInDialog: true;
          };
          readonly timeoutThreshold: {
            readonly type: 'number';
            readonly label: 'Timeout Threshold (ms)';
            readonly category: 'Model';
            readonly requiresRestart: false;
            readonly default: 30000;
            readonly description: 'Maximum time in milliseconds to wait for Flash model before considering it too slow (30 seconds default).';
            readonly showInDialog: true;
          };
          readonly enableSessionMemory: {
            readonly type: 'boolean';
            readonly label: 'Remember Escalation Decisions';
            readonly category: 'Model';
            readonly requiresRestart: false;
            readonly default: true;
            readonly description: 'Remember escalation patterns during the session to avoid repeated Flash failures for similar requests.';
            readonly showInDialog: true;
          };
          readonly complexityBias: {
            readonly type: 'enum';
            readonly label: 'Complexity Classification Bias';
            readonly category: 'Model';
            readonly requiresRestart: false;
            readonly default: 'flash-first';
            readonly description: 'How aggressively to favor Flash model in complexity classification.';
            readonly showInDialog: true;
            readonly options: readonly [
              {
                readonly value: 'flash-first';
                readonly label: 'Flash-First (Aggressive Cost Savings)';
              },
              {
                readonly value: 'balanced';
                readonly label: 'Balanced';
              },
              {
                readonly value: 'quality-first';
                readonly label: 'Quality-First (Conservative)';
              },
            ];
          };
        };
      };
    };
  };
  readonly context: {
    readonly type: 'object';
    readonly label: 'Context';
    readonly category: 'Context';
    readonly requiresRestart: false;
    readonly default: {};
    readonly description: 'Settings for managing context provided to the model.';
    readonly showInDialog: false;
    readonly properties: {
      readonly fileName: {
        readonly type: 'object';
        readonly label: 'Context File Name';
        readonly category: 'Context';
        readonly requiresRestart: false;
        readonly default: string | string[] | undefined;
        readonly description: 'The name of the context file.';
        readonly showInDialog: false;
      };
      readonly importFormat: {
        readonly type: 'string';
        readonly label: 'Memory Import Format';
        readonly category: 'Context';
        readonly requiresRestart: false;
        readonly default: MemoryImportFormat | undefined;
        readonly description: 'The format to use when importing memory.';
        readonly showInDialog: false;
      };
      readonly discoveryMaxDirs: {
        readonly type: 'number';
        readonly label: 'Memory Discovery Max Dirs';
        readonly category: 'Context';
        readonly requiresRestart: false;
        readonly default: 200;
        readonly description: 'Maximum number of directories to search for memory.';
        readonly showInDialog: true;
      };
      readonly includeDirectories: {
        readonly type: 'array';
        readonly label: 'Include Directories';
        readonly category: 'Context';
        readonly requiresRestart: false;
        readonly default: string[];
        readonly description: 'Additional directories to include in the workspace context. Missing directories will be skipped with a warning.';
        readonly showInDialog: false;
        readonly mergeStrategy: MergeStrategy.CONCAT;
      };
      readonly loadMemoryFromIncludeDirectories: {
        readonly type: 'boolean';
        readonly label: 'Load Memory From Include Directories';
        readonly category: 'Context';
        readonly requiresRestart: false;
        readonly default: false;
        readonly description: 'Whether to load memory files from include directories.';
        readonly showInDialog: true;
      };
      readonly fileFiltering: {
        readonly type: 'object';
        readonly label: 'File Filtering';
        readonly category: 'Context';
        readonly requiresRestart: true;
        readonly default: {};
        readonly description: 'Settings for git-aware file filtering.';
        readonly showInDialog: false;
        readonly properties: {
          readonly respectGitIgnore: {
            readonly type: 'boolean';
            readonly label: 'Respect .gitignore';
            readonly category: 'Context';
            readonly requiresRestart: true;
            readonly default: true;
            readonly description: 'Respect .gitignore files when searching';
            readonly showInDialog: true;
          };
          readonly respectGeminiIgnore: {
            readonly type: 'boolean';
            readonly label: 'Respect .geminiignore';
            readonly category: 'Context';
            readonly requiresRestart: true;
            readonly default: true;
            readonly description: 'Respect .geminiignore files when searching';
            readonly showInDialog: true;
          };
          readonly enableRecursiveFileSearch: {
            readonly type: 'boolean';
            readonly label: 'Enable Recursive File Search';
            readonly category: 'Context';
            readonly requiresRestart: true;
            readonly default: true;
            readonly description: 'Enable recursive file search functionality';
            readonly showInDialog: true;
          };
          readonly disableFuzzySearch: {
            readonly type: 'boolean';
            readonly label: 'Disable Fuzzy Search';
            readonly category: 'Context';
            readonly requiresRestart: true;
            readonly default: false;
            readonly description: 'Disable fuzzy search when searching for files.';
            readonly showInDialog: true;
          };
        };
      };
    };
  };
  readonly tools: {
    readonly type: 'object';
    readonly label: 'Tools';
    readonly category: 'Tools';
    readonly requiresRestart: true;
    readonly default: {};
    readonly description: 'Settings for built-in and custom tools.';
    readonly showInDialog: false;
    readonly properties: {
      readonly sandbox: {
        readonly type: 'object';
        readonly label: 'Sandbox';
        readonly category: 'Tools';
        readonly requiresRestart: true;
        readonly default: boolean | string | undefined;
        readonly description: 'Sandbox execution environment (can be a boolean or a path string).';
        readonly showInDialog: false;
      };
      readonly shell: {
        readonly type: 'object';
        readonly label: 'Shell';
        readonly category: 'Tools';
        readonly requiresRestart: false;
        readonly default: {};
        readonly description: 'Settings for shell execution.';
        readonly showInDialog: false;
        readonly properties: {
          readonly enableInteractiveShell: {
            readonly type: 'boolean';
            readonly label: 'Enable Interactive Shell';
            readonly category: 'Tools';
            readonly requiresRestart: true;
            readonly default: false;
            readonly description: 'Use node-pty for an interactive shell experience. Fallback to child_process still applies.';
            readonly showInDialog: true;
          };
          readonly pager: {
            readonly type: 'string';
            readonly label: 'Pager';
            readonly category: 'Tools';
            readonly requiresRestart: false;
            readonly default: string | undefined;
            readonly description: 'The pager command to use for shell output. Defaults to `cat`.';
            readonly showInDialog: false;
          };
          readonly showColor: {
            readonly type: 'boolean';
            readonly label: 'Show Color';
            readonly category: 'Tools';
            readonly requiresRestart: false;
            readonly default: false;
            readonly description: 'Show color in shell output.';
            readonly showInDialog: true;
          };
        };
      };
      readonly autoAccept: {
        readonly type: 'boolean';
        readonly label: 'Auto Accept';
        readonly category: 'Tools';
        readonly requiresRestart: false;
        readonly default: false;
        readonly description: 'Automatically accept and execute tool calls that are considered safe (e.g., read-only operations).';
        readonly showInDialog: true;
      };
      readonly core: {
        readonly type: 'array';
        readonly label: 'Core Tools';
        readonly category: 'Tools';
        readonly requiresRestart: true;
        readonly default: string[] | undefined;
        readonly description: 'Paths to core tool definitions.';
        readonly showInDialog: false;
      };
      readonly allowed: {
        readonly type: 'array';
        readonly label: 'Allowed Tools';
        readonly category: 'Advanced';
        readonly requiresRestart: true;
        readonly default: string[] | undefined;
        readonly description: 'A list of tool names that will bypass the confirmation dialog.';
        readonly showInDialog: false;
      };
      readonly exclude: {
        readonly type: 'array';
        readonly label: 'Exclude Tools';
        readonly category: 'Tools';
        readonly requiresRestart: true;
        readonly default: string[] | undefined;
        readonly description: 'Tool names to exclude from discovery.';
        readonly showInDialog: false;
        readonly mergeStrategy: MergeStrategy.UNION;
      };
      readonly discoveryCommand: {
        readonly type: 'string';
        readonly label: 'Tool Discovery Command';
        readonly category: 'Tools';
        readonly requiresRestart: true;
        readonly default: string | undefined;
        readonly description: 'Command to run for tool discovery.';
        readonly showInDialog: false;
      };
      readonly callCommand: {
        readonly type: 'string';
        readonly label: 'Tool Call Command';
        readonly category: 'Tools';
        readonly requiresRestart: true;
        readonly default: string | undefined;
        readonly description: 'Command to run for tool calls.';
        readonly showInDialog: false;
      };
      readonly useRipgrep: {
        readonly type: 'boolean';
        readonly label: 'Use Ripgrep';
        readonly category: 'Tools';
        readonly requiresRestart: false;
        readonly default: true;
        readonly description: 'Use ripgrep for file content search instead of the fallback implementation. Provides faster search performance.';
        readonly showInDialog: true;
      };
      readonly enableToolOutputTruncation: {
        readonly type: 'boolean';
        readonly label: 'Enable Tool Output Truncation';
        readonly category: 'General';
        readonly requiresRestart: true;
        readonly default: false;
        readonly description: 'Enable truncation of large tool outputs.';
        readonly showInDialog: true;
      };
      readonly truncateToolOutputThreshold: {
        readonly type: 'number';
        readonly label: 'Tool Output Truncation Threshold';
        readonly category: 'General';
        readonly requiresRestart: true;
        readonly default: 4000000;
        readonly description: 'Truncate tool output if it is larger than this many characters. Set to -1 to disable.';
        readonly showInDialog: true;
      };
      readonly truncateToolOutputLines: {
        readonly type: 'number';
        readonly label: 'Tool Output Truncation Lines';
        readonly category: 'General';
        readonly requiresRestart: true;
        readonly default: 1000;
        readonly description: 'The number of lines to keep when truncating tool output.';
        readonly showInDialog: true;
      };
      readonly enableMessageBusIntegration: {
        readonly type: 'boolean';
        readonly label: 'Enable Message Bus Integration';
        readonly category: 'Tools';
        readonly requiresRestart: true;
        readonly default: false;
        readonly description: 'Enable policy-based tool confirmation via message bus integration. When enabled, tools will automatically respect policy engine decisions (ALLOW/DENY/ASK_USER) without requiring individual tool implementations.';
        readonly showInDialog: true;
      };
    };
  };
  readonly mcp: {
    readonly type: 'object';
    readonly label: 'MCP';
    readonly category: 'MCP';
    readonly requiresRestart: true;
    readonly default: {};
    readonly description: 'Settings for Model Context Protocol (MCP) servers.';
    readonly showInDialog: false;
    readonly properties: {
      readonly serverCommand: {
        readonly type: 'string';
        readonly label: 'MCP Server Command';
        readonly category: 'MCP';
        readonly requiresRestart: true;
        readonly default: string | undefined;
        readonly description: 'Command to start an MCP server.';
        readonly showInDialog: false;
      };
      readonly allowed: {
        readonly type: 'array';
        readonly label: 'Allow MCP Servers';
        readonly category: 'MCP';
        readonly requiresRestart: true;
        readonly default: string[] | undefined;
        readonly description: 'A list of MCP servers to allow.';
        readonly showInDialog: false;
      };
      readonly excluded: {
        readonly type: 'array';
        readonly label: 'Exclude MCP Servers';
        readonly category: 'MCP';
        readonly requiresRestart: true;
        readonly default: string[] | undefined;
        readonly description: 'A list of MCP servers to exclude.';
        readonly showInDialog: false;
      };
    };
  };
  readonly useSmartEdit: {
    readonly type: 'boolean';
    readonly label: 'Use Smart Edit';
    readonly category: 'Advanced';
    readonly requiresRestart: false;
    readonly default: false;
    readonly description: 'Enable the smart-edit tool instead of the replace tool.';
    readonly showInDialog: false;
  };
  readonly useWriteTodos: {
    readonly type: 'boolean';
    readonly label: 'Use Write Todos';
    readonly category: 'Advanced';
    readonly requiresRestart: false;
    readonly default: false;
    readonly description: 'Enable the write_todos_list tool.';
    readonly showInDialog: false;
  };
  readonly security: {
    readonly type: 'object';
    readonly label: 'Security';
    readonly category: 'Security';
    readonly requiresRestart: true;
    readonly default: {};
    readonly description: 'Security-related settings.';
    readonly showInDialog: false;
    readonly properties: {
      readonly folderTrust: {
        readonly type: 'object';
        readonly label: 'Folder Trust';
        readonly category: 'Security';
        readonly requiresRestart: false;
        readonly default: {};
        readonly description: 'Settings for folder trust.';
        readonly showInDialog: false;
        readonly properties: {
          readonly enabled: {
            readonly type: 'boolean';
            readonly label: 'Folder Trust';
            readonly category: 'Security';
            readonly requiresRestart: true;
            readonly default: false;
            readonly description: 'Setting to track whether Folder trust is enabled.';
            readonly showInDialog: true;
          };
        };
      };
      readonly auth: {
        readonly type: 'object';
        readonly label: 'Authentication';
        readonly category: 'Security';
        readonly requiresRestart: true;
        readonly default: {};
        readonly description: 'Authentication settings.';
        readonly showInDialog: false;
        readonly properties: {
          readonly selectedType: {
            readonly type: 'string';
            readonly label: 'Selected Auth Type';
            readonly category: 'Security';
            readonly requiresRestart: true;
            readonly default: AuthType | undefined;
            readonly description: 'The currently selected authentication type.';
            readonly showInDialog: false;
          };
          readonly enforcedType: {
            readonly type: 'string';
            readonly label: 'Enforced Auth Type';
            readonly category: 'Advanced';
            readonly requiresRestart: true;
            readonly default: AuthType | undefined;
            readonly description: 'The required auth type. If this does not match the selected auth type, the user will be prompted to re-authenticate.';
            readonly showInDialog: false;
          };
          readonly useExternal: {
            readonly type: 'boolean';
            readonly label: 'Use External Auth';
            readonly category: 'Security';
            readonly requiresRestart: true;
            readonly default: boolean | undefined;
            readonly description: 'Whether to use an external authentication flow.';
            readonly showInDialog: false;
          };
        };
      };
    };
  };
  readonly advanced: {
    readonly type: 'object';
    readonly label: 'Advanced';
    readonly category: 'Advanced';
    readonly requiresRestart: true;
    readonly default: {};
    readonly description: 'Advanced settings for power users.';
    readonly showInDialog: false;
    readonly properties: {
      readonly autoConfigureMemory: {
        readonly type: 'boolean';
        readonly label: 'Auto Configure Max Old Space Size';
        readonly category: 'Advanced';
        readonly requiresRestart: true;
        readonly default: false;
        readonly description: 'Automatically configure Node.js memory limits';
        readonly showInDialog: false;
      };
      readonly dnsResolutionOrder: {
        readonly type: 'string';
        readonly label: 'DNS Resolution Order';
        readonly category: 'Advanced';
        readonly requiresRestart: true;
        readonly default: DnsResolutionOrder | undefined;
        readonly description: 'The DNS resolution order.';
        readonly showInDialog: false;
      };
      readonly excludedEnvVars: {
        readonly type: 'array';
        readonly label: 'Excluded Project Environment Variables';
        readonly category: 'Advanced';
        readonly requiresRestart: false;
        readonly default: string[];
        readonly description: 'Environment variables to exclude from project context.';
        readonly showInDialog: false;
        readonly mergeStrategy: MergeStrategy.UNION;
      };
      readonly bugCommand: {
        readonly type: 'object';
        readonly label: 'Bug Command';
        readonly category: 'Advanced';
        readonly requiresRestart: false;
        readonly default: BugCommandSettings | undefined;
        readonly description: 'Configuration for the bug report command.';
        readonly showInDialog: false;
      };
    };
  };
  readonly experimental: {
    readonly type: 'object';
    readonly label: 'Experimental';
    readonly category: 'Experimental';
    readonly requiresRestart: true;
    readonly default: {};
    readonly description: 'Setting to enable experimental features';
    readonly showInDialog: false;
    readonly properties: {
      readonly extensionManagement: {
        readonly type: 'boolean';
        readonly label: 'Extension Management';
        readonly category: 'Experimental';
        readonly requiresRestart: true;
        readonly default: true;
        readonly description: 'Enable extension management features.';
        readonly showInDialog: false;
      };
      readonly useModelRouter: {
        readonly type: 'boolean';
        readonly label: 'Enable Smart Model Routing';
        readonly category: 'Model';
        readonly requiresRestart: true;
        readonly default: true;
        readonly description: 'Enable AI-powered model routing to automatically select the best model based on task complexity. Required for Auto model selection to work.';
        readonly showInDialog: true;
      };
    };
  };
  readonly budget: {
    readonly type: 'object';
    readonly label: 'Budget';
    readonly category: 'Budget';
    readonly requiresRestart: false;
    readonly default: {};
    readonly description: 'Daily usage budget settings for API requests.';
    readonly showInDialog: true;
    readonly properties: {
      readonly enabled: {
        readonly type: 'boolean';
        readonly label: 'Enable Budget Tracking';
        readonly category: 'Budget';
        readonly requiresRestart: false;
        readonly default: false;
        readonly description: 'Enable daily budget tracking and enforcement.';
        readonly showInDialog: true;
      };
      readonly dailyLimit: {
        readonly type: 'number';
        readonly label: 'Daily Request Limit';
        readonly category: 'Budget';
        readonly requiresRestart: false;
        readonly default: 100;
        readonly description: 'Maximum number of API requests allowed per day.';
        readonly showInDialog: true;
      };
      readonly resetTime: {
        readonly type: 'string';
        readonly label: 'Budget Reset Time';
        readonly category: 'Budget';
        readonly requiresRestart: false;
        readonly default: '00:00';
        readonly description: 'Time of day when the daily budget resets (HH:MM format).';
        readonly showInDialog: true;
      };
      readonly warningThresholds: {
        readonly type: 'array';
        readonly label: 'Warning Thresholds';
        readonly category: 'Budget';
        readonly requiresRestart: false;
        readonly default: number[];
        readonly description: 'Percentage thresholds at which to show usage warnings.';
        readonly showInDialog: false;
        readonly mergeStrategy: MergeStrategy.REPLACE;
      };
    };
  };
  readonly extensions: {
    readonly type: 'object';
    readonly label: 'Extensions';
    readonly category: 'Extensions';
    readonly requiresRestart: true;
    readonly default: {};
    readonly description: 'Settings for extensions.';
    readonly showInDialog: false;
    readonly properties: {
      readonly disabled: {
        readonly type: 'array';
        readonly label: 'Disabled Extensions';
        readonly category: 'Extensions';
        readonly requiresRestart: true;
        readonly default: string[];
        readonly description: 'List of disabled extensions.';
        readonly showInDialog: false;
        readonly mergeStrategy: MergeStrategy.UNION;
      };
      readonly workspacesWithMigrationNudge: {
        readonly type: 'array';
        readonly label: 'Workspaces with Migration Nudge';
        readonly category: 'Extensions';
        readonly requiresRestart: false;
        readonly default: string[];
        readonly description: 'List of workspaces for which the migration nudge has been shown.';
        readonly showInDialog: false;
        readonly mergeStrategy: MergeStrategy.UNION;
      };
    };
  };
};
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
export declare function getSettingsSchema(): SettingsSchemaType;
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
  -readonly [K in keyof T]?: T[K] extends {
    properties: SettingsSchema;
  }
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
export {};
