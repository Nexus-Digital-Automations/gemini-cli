/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Type } from '@google/genai';
import { LruCache } from './LruCache.js';
import { DEFAULT_GEMINI_FLASH_MODEL } from '../config/models.js';
import { promptIdContext } from './promptIdContext.js';
const MAX_CACHE_SIZE = 50;
const EDIT_SYS_PROMPT = `
You are an expert code-editing assistant specializing in debugging and correcting failed search-and-replace operations.

# Primary Goal
Your task is to analyze a failed edit attempt and provide a corrected \`search\` string that will match the text in the file precisely. The correction should be as minimal as possible, staying very close to the original, failed \`search\` string. Do NOT invent a completely new edit based on the instruction; your job is to fix the provided parameters.

It is important that you do no try to figure out if the instruction is correct. DO NOT GIVE ADVICE. Your only goal here is to do your best to perform the search and replace task! 

# Input Context
You will be given:
1. The high-level instruction for the original edit.
2. The exact \`search\` and \`replace\` strings that failed.
3. The error message that was produced.
4. The full content of the source file.

# Rules for Correction
1.  **Minimal Correction:** Your new \`search\` string must be a close variation of the original. Focus on fixing issues like whitespace, indentation, line endings, or small contextual differences.
2.  **Explain the Fix:** Your \`explanation\` MUST state exactly why the original \`search\` failed and how your new \`search\` string resolves that specific failure. (e.g., "The original search failed due to incorrect indentation; the new search corrects the indentation to match the source file.").
3.  **Preserve the \`replace\` String:** Do NOT modify the \`replace\` string unless the instruction explicitly requires it and it was the source of the error. Your primary focus is fixing the \`search\` string.
4.  **No Changes Case:** CRUCIAL: if the change is already present in the file,  set \`noChangesRequired\` to True and explain why in the \`explanation\`. It is crucial that you only do this if the changes outline in \`replace\` are alredy in the file and suits the instruction!! 
5.  **Exactness:** The final \`search\` field must be the EXACT literal text from the file. Do not escape characters.
`;
const EDIT_USER_PROMPT = `
# Goal of the Original Edit
<instruction>
{instruction}
</instruction>

# Failed Attempt Details
- **Original \`search\` parameter (failed):**
<search>
{old_string}
</search>
- **Original \`replace\` parameter:**
<replace>
{new_string}
</replace>
- **Error Encountered:**
<error>
{error}
</error>

# Full File Content
<file_content>
{current_content}
</file_content>

# Your Task
Based on the error and the file content, provide a corrected \`search\` string that will succeed. Remember to keep your correction minimal and explain the precise reason for the failure in your \`explanation\`.
`;
const SearchReplaceEditSchema = {
    type: Type.OBJECT,
    properties: {
        explanation: { type: Type.STRING },
        search: { type: Type.STRING },
        replace: { type: Type.STRING },
        noChangesRequired: { type: Type.BOOLEAN },
    },
    required: ['search', 'replace', 'explanation'],
};
const editCorrectionWithInstructionCache = new LruCache(MAX_CACHE_SIZE);
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
export async function FixLLMEditWithInstruction(instruction, old_string, new_string, error, current_content, baseLlmClient, abortSignal) {
    let promptId = promptIdContext.getStore();
    if (!promptId) {
        promptId = `llm-fixer-fallback-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        console.warn(`Could not find promptId in context. This is unexpected. Using a fallback ID: ${promptId}`);
    }
    const cacheKey = `${instruction}---${old_string}---${new_string}--${current_content}--${error}`;
    const cachedResult = editCorrectionWithInstructionCache.get(cacheKey);
    if (cachedResult) {
        return cachedResult;
    }
    const userPrompt = EDIT_USER_PROMPT.replace('{instruction}', instruction)
        .replace('{old_string}', old_string)
        .replace('{new_string}', new_string)
        .replace('{error}', error)
        .replace('{current_content}', current_content);
    const contents = [
        {
            role: 'user',
            parts: [{ text: userPrompt }],
        },
    ];
    const result = (await baseLlmClient.generateJson({
        contents,
        schema: SearchReplaceEditSchema,
        abortSignal,
        model: DEFAULT_GEMINI_FLASH_MODEL,
        systemInstruction: EDIT_SYS_PROMPT,
        promptId,
        maxAttempts: 1,
    }));
    editCorrectionWithInstructionCache.set(cacheKey, result);
    return result;
}
/**
 * Clears the internal cache used by the LLM edit fixer.
 * This function is intended for testing purposes only to ensure clean state between tests.
 *
 * @internal
 */
export function resetLlmEditFixerCaches_TEST_ONLY() {
    editCorrectionWithInstructionCache.clear();
}
//# sourceMappingURL=llm-edit-fixer.js.map