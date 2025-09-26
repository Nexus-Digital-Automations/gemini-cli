/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type BaseLlmClient } from '../core/baseLlmClient.js';
/**
 * Represents the result of an LLM-corrected search and replace operation.
 * Used when the original edit attempt failed and needs to be fixed by analyzing the file content.
 */
export interface SearchReplaceEdit {
    /** The corrected search string that should match the exact text in the file */
    search: string;
    /** The replacement string to be used (typically unchanged from original) */
    replace: string;
    /** True if the desired change is already present in the file and no edit is needed */
    noChangesRequired: boolean;
    /** Detailed explanation of why the original search failed and how it was corrected */
    explanation: string;
}
/**
 * Attempts to fix a failed edit by using an LLM to generate a corrected search and replace pair.
 *
 * This function analyzes why a search-and-replace operation failed by providing the LLM with:
 * - The original instruction
 * - The failed search/replace strings
 * - The error message
 * - The complete file content
 *
 * The LLM then generates a corrected search string that should match the file exactly,
 * while preserving the original replacement logic.
 *
 * @param instruction - The high-level instruction describing what the edit should accomplish
 * @param old_string - The original search string that failed to match
 * @param new_string - The original replacement string (usually preserved)
 * @param error - The specific error message from the failed edit attempt
 * @param current_content - The complete current content of the target file
 * @param baseLlmClient - The LLM client instance to use for generating the correction
 * @param abortSignal - Signal to abort the LLM operation if needed
 * @returns Promise resolving to a corrected SearchReplaceEdit object
 *
 * @example
 * ```typescript
 * const correctedEdit = await FixLLMEditWithInstruction(
 *   'Add error handling to the function',
 *   'function getData() {', // This failed to match
 *   'function getData() {\n  try {',
 *   'Search string not found in file',
 *   fileContent,
 *   llmClient,
 *   abortController.signal
 * );
 * ```
 */
export declare function FixLLMEditWithInstruction(instruction: string, old_string: string, new_string: string, error: string, current_content: string, baseLlmClient: BaseLlmClient, abortSignal: AbortSignal): Promise<SearchReplaceEdit>;
/**
 * Clears the internal cache used by the LLM edit fixer.
 * This function is intended for testing purposes only to ensure clean state between tests.
 *
 * @internal
 */
export declare function resetLlmEditFixerCaches_TEST_ONLY(): void;
