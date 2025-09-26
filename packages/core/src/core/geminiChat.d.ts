/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { GenerateContentResponse} from '@google/genai';
import { type Content, type GenerateContentConfig, type SendMessageParameters, type Part, type Tool } from '@google/genai';
import type { Config } from '../config/config.js';
import type { StructuredError } from './turn.js';
import type { ChatRecordingService } from '../services/chatRecordingService.js';
export declare enum StreamEventType {
    /** A regular content chunk from the API. */
    CHUNK = "chunk",
    /** A signal that a retry is about to happen. The UI should discard any partial
     * content from the attempt that just failed. */
    RETRY = "retry"
}
export type StreamEvent = {
    type: StreamEventType.CHUNK;
    value: GenerateContentResponse;
} | {
    type: StreamEventType.RETRY;
};
export declare function isValidNonThoughtTextPart(part: Part): boolean;
/**
 * Custom error to signal that a stream completed with invalid content,
 * which should trigger a retry.
 */
export declare class InvalidStreamError extends Error {
    readonly type: 'NO_FINISH_REASON' | 'NO_RESPONSE_TEXT';
    constructor(message: string, type: 'NO_FINISH_REASON' | 'NO_RESPONSE_TEXT');
}
/**
 * Advanced chat session management for Gemini models with streaming, validation, and recovery.
 *
 * This class provides a sophisticated wrapper around Gemini API chat functionality,
 * implementing enterprise-grade features for reliable conversational AI interactions.
 * It handles complex scenarios including streaming responses, content validation,
 * automatic retries, and comprehensive conversation recording.
 *
 * Core Capabilities:
 * - Streaming message responses with real-time processing
 * - Automatic content validation and retry logic for invalid responses
 * - Conversation history management with curated and comprehensive views
 * - Tool execution integration with function calling capabilities
 * - Thought recording and analysis for model reasoning tracking
 * - Binary content detection and progress reporting
 * - Advanced error handling with fallback mechanisms
 *
 * Streaming Architecture:
 * The chat session implements a sophisticated streaming pipeline that processes
 * model responses in real-time, validates content quality, and automatically
 * retries failed requests. It supports multiple concurrent streams and maintains
 * conversation state consistency across all operations.
 *
 * Content Validation:
 * All model responses undergo validation to ensure they meet quality standards.
 * Invalid responses (empty content, missing finish reasons, etc.) trigger
 * automatic retries with exponential backoff to improve reliability.
 *
 * @example
 * ```typescript
 * const chat = new GeminiChat(config, generationConfig, history);
 * const stream = await chat.sendMessageStream(model, {
 *   message: [{ text: "Explain the concept of recursion" }]
 * }, promptId);
 *
 * for await (const event of stream) {
 *   if (event.type === StreamEventType.CHUNK) {
 *     console.log(event.value);
 *   }
 * }
 * ```
 *
 * @remarks
 * This class is designed for production use in developer tools and enterprise
 * applications requiring reliable AI assistance. It automatically handles
 * complex edge cases and provides comprehensive observability through
 * detailed logging and metrics collection.
 */
export declare class GeminiChat {
    private readonly config;
    private readonly generationConfig;
    private history;
    private sendPromise;
    private readonly chatRecordingService;
    /**
     * Creates a new GeminiChat session with the specified configuration and history.
     *
     * @param config - Application configuration containing API settings and dependencies
     * @param generationConfig - Model generation parameters (temperature, topP, etc.)
     * @param history - Initial conversation history as Content array
     *
     * @throws Error if the provided history contains invalid roles or structure
     *
     * @remarks
     * The constructor initializes the chat recording service and validates the
     * conversation history to ensure it follows the expected user/model alternating
     * pattern. History validation prevents API errors from malformed conversations.
     */
    constructor(config: Config, generationConfig?: GenerateContentConfig, history?: Content[]);
    setSystemInstruction(sysInstr: string): void;
    /**
     * Sends a message to the model and returns the response in chunks.
     *
     * @remarks
     * This method will wait for the previous message to be processed before
     * sending the next message.
     *
     * @see {@link Chat#sendMessage} for non-streaming method.
     * @param params - parameters for sending the message.
     * @return The model's response.
     *
     * @example
     * ```ts
     * const chat = ai.chats.create({model: 'gemini-2.0-flash'});
     * const response = await chat.sendMessageStream({
     * message: 'Why is the sky blue?'
     * });
     * for await (const chunk of response) {
     * console.log(chunk.text);
     * }
     * ```
     */
    sendMessageStream(model: string, params: SendMessageParameters, prompt_id: string): Promise<AsyncGenerator<StreamEvent>>;
    private makeApiCallAndProcessStream;
    /**
     * Returns the conversation history in either curated or comprehensive format.
     *
     * @param curated - Whether to return curated (API-ready) or comprehensive (complete) history
     * @returns Deep copy of conversation history as Content array
     *
     * @remarks
     * This method provides access to two distinct views of conversation history:
     *
     * **Curated History** (curated=true):
     * - Contains only valid, API-compatible conversation turns
     * - Filters out malformed or empty model responses
     * - Safe for use in subsequent API requests
     * - Automatically maintains proper user/model alternation
     *
     * **Comprehensive History** (curated=false, default):
     * - Complete record of all conversation attempts
     * - Includes failed responses and retry attempts
     * - Provides full audit trail for debugging
     * - May contain invalid content not suitable for API use
     *
     * The returned array is a deep copy to prevent external modifications
     * from affecting the internal conversation state. History is updated
     * continuously as streaming responses are received.
     *
     * @example
     * ```typescript
     * // Get API-ready history for model requests
     * const cleanHistory = chat.getHistory(true);
     *
     * // Get complete history for debugging/analysis
     * const fullHistory = chat.getHistory(false);
     * ```
     */
    getHistory(curated?: boolean): Content[];
    /**
     * Clears the chat history.
     */
    clearHistory(): void;
    /**
     * Adds a new entry to the chat history.
     */
    addHistory(content: Content): void;
    setHistory(history: Content[]): void;
    stripThoughtsFromHistory(): void;
    setTools(tools: Tool[]): void;
    maybeIncludeSchemaDepthContext(error: StructuredError): Promise<void>;
    private processStreamResponse;
    /**
     * Gets the chat recording service instance.
     */
    getChatRecordingService(): ChatRecordingService;
    /**
     * Extracts and records thought from thought content.
     */
    private recordThoughtFromContent;
    /**
     * Truncates the chunkStream right before the second function call to a
     * function that mutates state. This may involve trimming parts from a chunk
     * as well as omtting some chunks altogether.
     *
     * We do this because it improves tool call quality if the model gets
     * feedback from one mutating function call before it makes the next one.
     */
    private stopBeforeSecondMutator;
    private isMutatorFunctionCall;
}
/** Visible for Testing */
export declare function isSchemaDepthError(errorMessage: string): boolean;
export declare function isInvalidArgumentError(errorMessage: string): boolean;
