/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BaseLlmClient } from '../core/baseLlmClient.js';
import type { GeminiChat } from '../core/geminiChat.js';
/**
 * Response structure for next speaker determination logic.
 * Used to determine who should speak next in a conversation flow.
 */
export interface NextSpeakerResponse {
    /** Brief explanation justifying the next_speaker choice based on conversation analysis */
    reasoning: string;
    /** Who should speak next: either the user or the model */
    next_speaker: 'user' | 'model';
}
/**
 * Analyzes the conversation history to determine who should speak next.
 * Uses LLM analysis to decide between 'user' or 'model' based on conversation context.
 *
 * @param chat The Gemini chat instance containing conversation history
 * @param baseLlmClient LLM client for performing the next speaker analysis
 * @param abortSignal Signal to abort the analysis operation if needed
 * @param promptId Unique identifier for this analysis prompt
 * @returns Promise resolving to next speaker response or null if determination fails
 */
export declare function checkNextSpeaker(chat: GeminiChat, baseLlmClient: BaseLlmClient, abortSignal: AbortSignal, promptId: string): Promise<NextSpeakerResponse | null>;
