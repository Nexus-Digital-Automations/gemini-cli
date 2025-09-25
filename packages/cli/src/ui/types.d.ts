/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CompressionStatus, ThoughtSummary, ToolCallConfirmationDetails, ToolConfirmationOutcome, ToolResultDisplay } from '@google/gemini-cli-core';
import type { PartListUnion } from '@google/genai';
import { type ReactNode } from 'react';
export type { ThoughtSummary };
/**
 * Represents the current authentication state of the user.
 * Used to track the user's authentication status throughout the application lifecycle.
 */
export declare enum AuthState {
    /** User is not authenticated or authentication has failed */
    Unauthenticated = "unauthenticated",
    /** Authentication dialog is open for user to select auth method */
    Updating = "updating",
    /** User is successfully authenticated and ready to use the application */
    Authenticated = "authenticated"
}
/**
 * Represents the current streaming state of the LLM response.
 * Used to track the real-time status of conversation with the model.
 */
export declare enum StreamingState {
    /** No active streaming, ready for new input */
    Idle = "idle",
    /** LLM is currently generating and streaming a response */
    Responding = "responding",
    /** LLM response is complete but waiting for user confirmation before executing tools */
    WaitingForConfirmation = "waiting_for_confirmation"
}
/**
 * Represents different types of events that can occur during Gemini model interaction.
 * Copied from server/src/core/turn.ts for CLI usage.
 */
export declare enum GeminiEventType {
    /** Standard content response from the model */
    Content = "content",
    /** Model is requesting to execute a tool/function call */
    ToolCallRequest = "tool_call_request"
}
/**
 * Represents the current status of a tool call execution.
 * Used to track the lifecycle of tool/function calls from request to completion.
 */
export declare enum ToolCallStatus {
    /** Tool call has been requested but not yet processed */
    Pending = "Pending",
    /** Tool call was canceled before execution */
    Canceled = "Canceled",
    /** Tool call is awaiting user confirmation before execution */
    Confirming = "Confirming",
    /** Tool call is currently being executed */
    Executing = "Executing",
    /** Tool call completed successfully */
    Success = "Success",
    /** Tool call failed with an error */
    Error = "Error"
}
/**
 * Represents a tool call event that occurs during model interaction.
 * Contains all the necessary information to track and display tool execution status.
 */
export interface ToolCallEvent {
    /** Event type identifier for tool calls */
    type: 'tool_call';
    /** Current status of the tool call execution */
    status: ToolCallStatus;
    /** Unique identifier for this specific tool call */
    callId: string;
    /** Name of the tool being called */
    name: string;
    /** Arguments passed to the tool (currently unused/empty) */
    args: Record<string, never>;
    /** Display information for the tool's result output */
    resultDisplay: ToolResultDisplay | undefined;
    /** Details needed for user confirmation before tool execution */
    confirmationDetails: ToolCallConfirmationDetails | undefined;
}
/**
 * Display information for an individual tool call in the UI.
 * Used by UI components to render tool call details and results.
 */
export interface IndividualToolCallDisplay {
    /** Unique identifier for this tool call */
    callId: string;
    /** Name of the tool being called */
    name: string;
    /** Human-readable description of what the tool does */
    description: string;
    /** Display information for the tool's execution result */
    resultDisplay: ToolResultDisplay | undefined;
    /** Current execution status of the tool call */
    status: ToolCallStatus;
    /** Details needed for user confirmation before execution */
    confirmationDetails: ToolCallConfirmationDetails | undefined;
    /** Whether to render the tool output as markdown (optional) */
    renderOutputAsMarkdown?: boolean;
    /** PTY session ID for interactive tools (optional) */
    ptyId?: number;
    /** Output file path for tools that write to files (optional) */
    outputFile?: string;
}
/**
 * Properties for compression-related UI components.
 * Used to display token compression status and progress to users.
 */
export interface CompressionProps {
    /** Whether compression is currently in progress */
    isPending: boolean;
    /** Original token count before compression */
    originalTokenCount: number | null;
    /** New token count after compression */
    newTokenCount: number | null;
    /** Current status of the compression operation */
    compressionStatus: CompressionStatus | null;
}
/**
 * Base interface for all history items in the conversation.
 * Provides common properties shared across different message types.
 */
export interface HistoryItemBase {
    /** Text content for user/gemini/info/error messages */
    text?: string;
}
/**
 * Represents a message sent by the user in the conversation history.
 */
export type HistoryItemUser = HistoryItemBase & {
    /** Message type identifier for user messages */
    type: 'user';
    /** The user's input text */
    text: string;
};
/**
 * Represents a response from the Gemini model in the conversation history.
 */
export type HistoryItemGemini = HistoryItemBase & {
    /** Message type identifier for Gemini responses */
    type: 'gemini';
    /** The model's response text */
    text: string;
};
export type HistoryItemGeminiContent = HistoryItemBase & {
    type: 'gemini_content';
    text: string;
};
export type HistoryItemInfo = HistoryItemBase & {
    type: 'info';
    text: string;
};
export type HistoryItemError = HistoryItemBase & {
    type: 'error';
    text: string;
};
export type HistoryItemWarning = HistoryItemBase & {
    type: 'warning';
    text: string;
};
export type HistoryItemAbout = HistoryItemBase & {
    type: 'about';
    cliVersion: string;
    osVersion: string;
    sandboxEnv: string;
    modelVersion: string;
    selectedAuthType: string;
    gcpProject: string;
    ideClient: string;
};
export type HistoryItemHelp = HistoryItemBase & {
    type: 'help';
    timestamp: Date;
};
export type HistoryItemStats = HistoryItemBase & {
    type: 'stats';
    duration: string;
};
export type HistoryItemModelStats = HistoryItemBase & {
    type: 'model_stats';
};
export type HistoryItemToolStats = HistoryItemBase & {
    type: 'tool_stats';
};
export type HistoryItemQuit = HistoryItemBase & {
    type: 'quit';
    duration: string;
};
export type HistoryItemToolGroup = HistoryItemBase & {
    type: 'tool_group';
    tools: IndividualToolCallDisplay[];
};
export type HistoryItemUserShell = HistoryItemBase & {
    type: 'user_shell';
    text: string;
};
export type HistoryItemCompression = HistoryItemBase & {
    type: 'compression';
    compression: CompressionProps;
};
export type HistoryItemExtensionsList = HistoryItemBase & {
    type: 'extensions_list';
};
export type HistoryItemWithoutId = HistoryItemUser | HistoryItemUserShell | HistoryItemGemini | HistoryItemGeminiContent | HistoryItemInfo | HistoryItemError | HistoryItemWarning | HistoryItemAbout | HistoryItemHelp | HistoryItemToolGroup | HistoryItemStats | HistoryItemModelStats | HistoryItemToolStats | HistoryItemQuit | HistoryItemCompression | HistoryItemExtensionsList;
export type HistoryItem = HistoryItemWithoutId & {
    id: number;
};
export declare enum MessageType {
    INFO = "info",
    ERROR = "error",
    WARNING = "warning",
    USER = "user",
    ABOUT = "about",
    HELP = "help",
    STATS = "stats",
    MODEL_STATS = "model_stats",
    TOOL_STATS = "tool_stats",
    QUIT = "quit",
    GEMINI = "gemini",
    COMPRESSION = "compression",
    EXTENSIONS_LIST = "extensions_list"
}
export type Message = {
    type: MessageType.INFO | MessageType.ERROR | MessageType.USER;
    content: string;
    timestamp: Date;
} | {
    type: MessageType.ABOUT;
    timestamp: Date;
    cliVersion: string;
    osVersion: string;
    sandboxEnv: string;
    modelVersion: string;
    selectedAuthType: string;
    gcpProject: string;
    ideClient: string;
    content?: string;
} | {
    type: MessageType.HELP;
    timestamp: Date;
    content?: string;
} | {
    type: MessageType.STATS;
    timestamp: Date;
    duration: string;
    content?: string;
} | {
    type: MessageType.MODEL_STATS;
    timestamp: Date;
    content?: string;
} | {
    type: MessageType.TOOL_STATS;
    timestamp: Date;
    content?: string;
} | {
    type: MessageType.QUIT;
    timestamp: Date;
    duration: string;
    content?: string;
} | {
    type: MessageType.COMPRESSION;
    compression: CompressionProps;
    timestamp: Date;
};
export interface ConsoleMessageItem {
    type: 'log' | 'warn' | 'error' | 'debug' | 'info';
    content: string;
    count: number;
}
/**
 * Result type for a slash command that should immediately result in a prompt
 * being submitted to the Gemini model.
 */
export interface SubmitPromptResult {
    type: 'submit_prompt';
    content: PartListUnion;
}
/**
 * Defines the result of the slash command processor for its consumer (useGeminiStream).
 */
export type SlashCommandProcessorResult = {
    type: 'schedule_tool';
    toolName: string;
    toolArgs: Record<string, unknown>;
} | {
    type: 'handled';
} | SubmitPromptResult;
export interface ShellConfirmationRequest {
    commands: string[];
    onConfirm: (outcome: ToolConfirmationOutcome, approvedCommands?: string[]) => void;
}
export interface ConfirmationRequest {
    prompt: ReactNode;
    onConfirm: (confirm: boolean) => void;
}
export interface LoopDetectionConfirmationRequest {
    onComplete: (result: {
        userSelection: 'disable' | 'keep';
    }) => void;
}
export { OperationType, ProgressState, type OperationContext, type ProgressStep, type OperationProgress, type ProgressUpdate, type ProgressInteraction, } from '@google/gemini-cli-core';
