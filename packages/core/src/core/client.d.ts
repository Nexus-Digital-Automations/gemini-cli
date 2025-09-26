/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { GenerateContentConfig, PartListUnion, Content, GenerateContentResponse } from '@google/genai';
import type { ServerGeminiStreamEvent, ChatCompressionInfo } from './turn.js';
import { Turn } from './turn.js';
import type { Config } from '../config/config.js';
import { GeminiChat } from './geminiChat.js';
import type { ChatRecordingService } from '../services/chatRecordingService.js';
import { LoopDetectionService } from '../services/loopDetectionService.js';
export declare function isThinkingSupported(model: string): boolean;
export declare function isThinkingDefault(model: string): boolean;
/**
 * Returns the index of the oldest item to keep when compressing. May return
 * contents.length which indicates that everything should be compressed.
 *
 * Exported for testing purposes.
 */
export declare function findCompressSplitPoint(contents: Content[], fraction: number): number;
/**
 * Central client for managing Gemini chat sessions and model interactions.
 *
 * This class serves as the primary interface for interacting with Google's Gemini
 * language models, providing comprehensive session management, conversation handling,
 * and intelligent routing capabilities. It orchestrates complex conversational AI
 * workflows including chat compression, loop detection, model routing, and tool execution.
 *
 * Key Features:
 * - Intelligent model routing and selection
 * - Automatic chat history compression when approaching token limits
 * - Loop detection and prevention for infinite conversation cycles
 * - Tool registry integration for function calling
 * - IDE context integration for development scenarios
 * - Comprehensive error handling and fallback mechanisms
 * - Session recording and replay capabilities
 *
 * @example
 * ```typescript
 * const client = new GeminiClient(config);
 * await client.initialize();
 *
 * // Send a message and stream responses
 * for await (const event of client.sendMessageStream(
 *   [{ text: "Explain quantum computing" }],
 *   abortSignal,
 *   promptId
 * )) {
 *   if (event.type === GeminiEventType.Text) {
 *     console.log(event.value);
 *   }
 * }
 * ```
 *
 * @remarks
 * This client manages stateful conversation sessions and automatically handles
 * complex scenarios like context window management, model fallbacks, and
 * conversation compression. It's designed for production use in developer tools
 * and enterprise applications requiring reliable AI assistance.
 */
export declare class GeminiClient {
    private readonly config;
    private chat?;
    private readonly generateContentConfig;
    private sessionTurnCount;
    private readonly loopDetector;
    private lastPromptId;
    private currentSequenceModel;
    private lastSentIdeContext;
    private forceFullIdeContext;
    /**
     * At any point in this conversation, was compression triggered without
     * being forced and did it fail?
     */
    private hasFailedCompressionAttempt;
    /**
     * Creates a new GeminiClient instance with the provided configuration.
     *
     * @param config - Configuration object containing model settings, API credentials,
     *                and service dependencies
     *
     * @remarks
     * The constructor initializes essential services including loop detection,
     * session management, and sets up initial conversation state. The client
     * requires explicit initialization via the initialize() method before use.
     */
    constructor(config: Config);
    /**
     * Initializes the client by creating a new chat session.
     *
     * @returns A promise that resolves when initialization is complete
     * @throws Error if chat initialization fails
     *
     * @remarks
     * This method must be called before using other client methods.
     * It establishes the initial chat session with system context,
     * environment information, and tool registry setup.
     */
    initialize(): Promise<void>;
    private getContentGeneratorOrFail;
    addHistory(content: Content): Promise<void>;
    getChat(): GeminiChat;
    isInitialized(): boolean;
    getHistory(): Content[];
    stripThoughtsFromHistory(): void;
    setHistory(history: Content[]): void;
    setTools(): Promise<void>;
    resetChat(): Promise<void>;
    getChatRecordingService(): ChatRecordingService | undefined;
    getLoopDetectionService(): LoopDetectionService;
    addDirectoryContext(): Promise<void>;
    startChat(extraHistory?: Content[]): Promise<GeminiChat>;
    private getIdeContextParts;
    /**
     * Sends a message to the model and streams back responses with advanced conversation management.
     *
     * @param request - The message content to send (text, images, files, etc.)
     * @param signal - AbortSignal for canceling the operation
     * @param prompt_id - Unique identifier for this conversation sequence
     * @param turns - Maximum number of conversation turns (default: 100)
     * @returns An async generator yielding streaming events and returning the final Turn
     *
     * @throws Error if the chat is not initialized or if the operation fails
     *
     * @remarks
     * This method orchestrates complex conversational AI workflows including:
     * - Automatic chat compression when approaching token limits
     * - Loop detection and prevention
     * - Model routing and selection
     * - IDE context integration
     * - Tool execution and function calling
     * - Next speaker determination for multi-turn conversations
     *
     * The method yields various event types during execution:
     * - Text chunks from model responses
     * - Tool call events and results
     * - Compression notifications
     * - Loop detection warnings
     * - Error conditions
     *
     * @example
     * ```typescript
     * for await (const event of client.sendMessageStream(
     *   [{ text: "Write a Python function to sort a list" }],
     *   abortController.signal,
     *   "unique-prompt-id"
     * )) {
     *   switch (event.type) {
     *     case GeminiEventType.Text:
     *       console.log(event.value);
     *       break;
     *     case GeminiEventType.ToolCall:
     *       console.log('Tool called:', event.value);
     *       break;
     *   }
     * }
     * ```
     */
    sendMessageStream(request: PartListUnion, signal: AbortSignal, prompt_id: string, turns?: number): AsyncGenerator<ServerGeminiStreamEvent, Turn>;
    generateContent(contents: Content[], generationConfig: GenerateContentConfig, abortSignal: AbortSignal, model: string): Promise<GenerateContentResponse>;
    /**
     * Attempts to compress the chat history when approaching token limits.
     *
     * @param prompt_id - Unique identifier for this conversation sequence
     * @param force - Whether to force compression regardless of token count
     * @returns Information about the compression operation including token counts
     *
     * @throws Error if compression fails due to token counting issues
     *
     * @remarks
     * This method implements intelligent chat history compression to maintain
     * conversation context while staying within model token limits. It:
     *
     * 1. Analyzes current token usage against model limits
     * 2. Identifies safe compression points (typically user messages)
     * 3. Generates a concise summary of older conversation history
     * 4. Replaces old history with the summary while preserving recent context
     * 5. Validates that compression actually reduced token count
     *
     * Compression is triggered when chat history exceeds 70% of the model's
     * token limit, preserving the most recent 30% of the conversation.
     * Failed compression attempts are tracked to prevent infinite retry loops.
     *
     * @example
     * ```typescript
     * const compressionResult = await client.tryCompressChat(promptId, false);
     * if (compressionResult.compressionStatus === CompressionStatus.COMPRESSED) {
     *   console.log(`Reduced from ${compressionResult.originalTokenCount} to ${compressionResult.newTokenCount} tokens`);
     * }
     * ```
     */
    tryCompressChat(prompt_id: string, force?: boolean): Promise<ChatCompressionInfo>;
}
export declare const TEST_ONLY: {
    COMPRESSION_PRESERVE_THRESHOLD: number;
    COMPRESSION_TOKEN_THRESHOLD: number;
};
