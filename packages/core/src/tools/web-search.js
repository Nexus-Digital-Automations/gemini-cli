/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseDeclarativeTool, BaseToolInvocation, Kind } from './tools.js';
import { ToolErrorType } from './tool-error.js';
import { getErrorMessage } from '../utils/errors.js';
import {} from '../config/config.js';
import { getResponseText } from '../utils/partUtils.js';
import { DEFAULT_GEMINI_FLASH_MODEL } from '../config/models.js';
/**
 * Implementation of web search execution logic using Google Search via Gemini API
 *
 * This class handles the complete web search workflow including:
 * - Query execution through Gemini's Google Search integration
 * - Source extraction and citation formatting
 * - Response text modification with inline citations
 * - Error handling for search failures
 */
class WebSearchToolInvocation extends BaseToolInvocation {
    config;
    /**
     * Creates a new web search tool invocation
     * @param config - Configuration object containing Gemini client settings
     * @param params - Web search parameters including the query
     */
    constructor(config, params) {
        super(params);
        this.config = config;
    }
    /**
     * Gets a human-readable description of the search operation
     * @returns Formatted description of the search query
     */
    getDescription() {
        return `Searching the web for: "${this.params.query}"`;
    }
    /**
     * Executes the web search and processes results with citations
     *
     * This method performs the following operations:
     * - Sends the search query to Google Search via Gemini API
     * - Extracts grounding metadata including source URLs and titles
     * - Processes grounding supports to add inline citations
     * - Formats the response with source list and citations
     * - Handles UTF-8 byte positioning for citation insertion
     *
     * @param signal - Abort signal for cancellation
     * @returns Promise resolving to search results with sources and citations
     *
     * @example
     * ```typescript
     * const result = await invocation.execute(abortSignal);
     * console.log(result.llmContent); // Search results with citations
     * console.log(result.sources); // Array of source URLs and titles
     * ```
     */
    async execute(signal) {
        const geminiClient = this.config.getGeminiClient();
        try {
            const response = await geminiClient.generateContent([{ role: 'user', parts: [{ text: this.params.query }] }], { tools: [{ googleSearch: {} }] }, signal, DEFAULT_GEMINI_FLASH_MODEL);
            const responseText = getResponseText(response);
            const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
            const sources = groundingMetadata?.groundingChunks;
            const groundingSupports = groundingMetadata?.groundingSupports;
            if (!responseText || !responseText.trim()) {
                return {
                    llmContent: `No search results or information found for query: "${this.params.query}"`,
                    returnDisplay: 'No information found.',
                };
            }
            let modifiedResponseText = responseText;
            const sourceListFormatted = [];
            if (sources && sources.length > 0) {
                sources.forEach((source, index) => {
                    const title = source.web?.title || 'Untitled';
                    const uri = source.web?.uri || 'No URI';
                    sourceListFormatted.push(`[${index + 1}] ${title} (${uri})`);
                });
                if (groundingSupports && groundingSupports.length > 0) {
                    const insertions = [];
                    groundingSupports.forEach((support) => {
                        if (support.segment && support.groundingChunkIndices) {
                            const citationMarker = support.groundingChunkIndices
                                .map((chunkIndex) => `[${chunkIndex + 1}]`)
                                .join('');
                            insertions.push({
                                index: support.segment.endIndex,
                                marker: citationMarker,
                            });
                        }
                    });
                    // Sort insertions by index in descending order to avoid shifting subsequent indices
                    insertions.sort((a, b) => b.index - a.index);
                    // Use TextEncoder/TextDecoder since segment indices are UTF-8 byte positions
                    const encoder = new TextEncoder();
                    const responseBytes = encoder.encode(modifiedResponseText);
                    const parts = [];
                    let lastIndex = responseBytes.length;
                    for (const ins of insertions) {
                        const pos = Math.min(ins.index, lastIndex);
                        parts.unshift(responseBytes.subarray(pos, lastIndex));
                        parts.unshift(encoder.encode(ins.marker));
                        lastIndex = pos;
                    }
                    parts.unshift(responseBytes.subarray(0, lastIndex));
                    // Concatenate all parts into a single buffer
                    const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
                    const finalBytes = new Uint8Array(totalLength);
                    let offset = 0;
                    for (const part of parts) {
                        finalBytes.set(part, offset);
                        offset += part.length;
                    }
                    modifiedResponseText = new TextDecoder().decode(finalBytes);
                }
                if (sourceListFormatted.length > 0) {
                    modifiedResponseText +=
                        '\n\nSources:\n' + sourceListFormatted.join('\n');
                }
            }
            return {
                llmContent: `Web search results for "${this.params.query}":\n\n${modifiedResponseText}`,
                returnDisplay: `Search results for "${this.params.query}" returned.`,
                sources,
            };
        }
        catch (error) {
            const errorMessage = `Error during web search for query "${this.params.query}": ${getErrorMessage(error)}`;
            console.error(errorMessage, error);
            return {
                llmContent: `Error: ${errorMessage}`,
                returnDisplay: `Error performing web search.`,
                error: {
                    message: errorMessage,
                    type: ToolErrorType.WEB_SEARCH_FAILED,
                },
            };
        }
    }
}
/**
 * Web search tool using Google Search integration via Gemini API
 *
 * This tool provides access to real-time web search results through Google Search,
 * integrated with Gemini's grounding capabilities. Features include:
 * - Real-time web search results from Google
 * - Automatic source citation and grounding
 * - URL and title extraction from search results
 * - Inline citation placement within response text
 * - UTF-8 aware text processing for accurate positioning
 *
 * The tool is particularly useful for:
 * - Finding current information and recent developments
 * - Researching topics with authoritative sources
 * - Fact-checking and verification with citations
 * - Gathering information from across the web
 */
export class WebSearchTool extends BaseDeclarativeTool {
    config;
    /** Tool identifier for registration and configuration */
    static Name = 'google_web_search';
    /**
     * Creates a new web search tool instance
     * @param config - Configuration object containing Gemini API settings
     */
    constructor(config) {
        super(WebSearchTool.Name, 'GoogleSearch', 'Performs a web search using Google Search (via the Gemini API) and returns the results. This tool is useful for finding information on the internet based on a query.', Kind.Search, {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'The search query to find information on the web.',
                },
            },
            required: ['query'],
        });
        this.config = config;
    }
    /**
     * Validates the parameters for the WebSearchTool.
     * @param params The parameters to validate
     * @returns An error message string if validation fails, null if valid
     */
    validateToolParamValues(params) {
        if (!params.query || params.query.trim() === '') {
            return "The 'query' parameter cannot be empty.";
        }
        return null;
    }
    /**
     * Creates a web search tool invocation instance
     * @param params - Validated web search parameters
     * @returns Configured web search invocation ready for execution
     */
    createInvocation(params) {
        return new WebSearchToolInvocation(this.config, params);
    }
}
//# sourceMappingURL=web-search.js.map