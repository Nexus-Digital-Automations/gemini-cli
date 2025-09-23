/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { GroundingMetadata } from '@google/genai';
import type { ToolInvocation, ToolResult } from './tools.js';
import { BaseDeclarativeTool, BaseToolInvocation, Kind } from './tools.js';
import { ToolErrorType } from './tool-error.js';

import { getErrorMessage } from '../utils/errors.js';
import { type Config } from '../config/config.js';
import { getResponseText } from '../utils/partUtils.js';
import { DEFAULT_GEMINI_FLASH_MODEL } from '../config/models.js';

/**
 * Web grounding chunk metadata from Google Search results
 */
interface GroundingChunkWeb {
  /** URL of the source webpage */
  uri?: string;
  /** Title of the source webpage */
  title?: string;
}

/**
 * Grounding chunk item containing web search result metadata
 */
interface GroundingChunkItem {
  /** Web-specific metadata for the grounding chunk */
  web?: GroundingChunkWeb;
  // Other properties might exist if needed in the future
}

/**
 * Text segment information for grounding support
 */
interface GroundingSupportSegment {
  /** Start position in the text (UTF-8 byte index) */
  startIndex: number;
  /** End position in the text (UTF-8 byte index) */
  endIndex: number;
  /** Optional text content of the segment */
  text?: string;
}

/**
 * Support item linking text segments to grounding chunks
 */
interface GroundingSupportItem {
  /** Text segment this support item refers to */
  segment?: GroundingSupportSegment;
  /** Indices of grounding chunks that support this segment */
  groundingChunkIndices?: number[];
  /** Confidence scores for the grounding chunks */
  confidenceScores?: number[];
}

/**
 * Parameters for the WebSearchTool
 */
export interface WebSearchToolParams {
  /** The search query to execute on Google Search */
  query: string;
}

/**
 * Extended tool result including web search sources and citations
 */
export interface WebSearchToolResult extends ToolResult {
  /** Grounding chunks containing source URLs and titles from search results */
  sources?: GroundingMetadata extends { groundingChunks: GroundingChunkItem[] }
    ? GroundingMetadata['groundingChunks']
    : GroundingChunkItem[];
}

/**
 * Implementation of web search execution logic using Google Search via Gemini API
 *
 * This class handles the complete web search workflow including:
 * - Query execution through Gemini's Google Search integration
 * - Source extraction and citation formatting
 * - Response text modification with inline citations
 * - Error handling for search failures
 */
class WebSearchToolInvocation extends BaseToolInvocation<
  WebSearchToolParams,
  WebSearchToolResult
> {
  /**
   * Creates a new web search tool invocation
   * @param config - Configuration object containing Gemini client settings
   * @param params - Web search parameters including the query
   */
  constructor(
    private readonly config: Config,
    params: WebSearchToolParams,
  ) {
    super(params);
  }

  /**
   * Gets a human-readable description of the search operation
   * @returns Formatted description of the search query
   */
  override getDescription(): string {
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
  async execute(signal: AbortSignal): Promise<WebSearchToolResult> {
    const geminiClient = this.config.getGeminiClient();

    try {
      const response = await geminiClient.generateContent(
        [{ role: 'user', parts: [{ text: this.params.query }] }],
        { tools: [{ googleSearch: {} }] },
        signal,
        DEFAULT_GEMINI_FLASH_MODEL,
      );

      const responseText = getResponseText(response);
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      const sources = groundingMetadata?.groundingChunks as
        | GroundingChunkItem[]
        | undefined;
      const groundingSupports = groundingMetadata?.groundingSupports as
        | GroundingSupportItem[]
        | undefined;

      if (!responseText || !responseText.trim()) {
        return {
          llmContent: `No search results or information found for query: "${this.params.query}"`,
          returnDisplay: 'No information found.',
        };
      }

      let modifiedResponseText = responseText;
      const sourceListFormatted: string[] = [];

      if (sources && sources.length > 0) {
        sources.forEach((source: GroundingChunkItem, index: number) => {
          const title = source.web?.title || 'Untitled';
          const uri = source.web?.uri || 'No URI';
          sourceListFormatted.push(`[${index + 1}] ${title} (${uri})`);
        });

        if (groundingSupports && groundingSupports.length > 0) {
          const insertions: Array<{ index: number; marker: string }> = [];
          groundingSupports.forEach((support: GroundingSupportItem) => {
            if (support.segment && support.groundingChunkIndices) {
              const citationMarker = support.groundingChunkIndices
                .map((chunkIndex: number) => `[${chunkIndex + 1}]`)
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
          const parts: Uint8Array[] = [];
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
    } catch (error: unknown) {
      const errorMessage = `Error during web search for query "${
        this.params.query
      }": ${getErrorMessage(error)}`;
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
export class WebSearchTool extends BaseDeclarativeTool<
  WebSearchToolParams,
  WebSearchToolResult
> {
  /** Tool identifier for registration and configuration */
  static readonly Name: string = 'google_web_search';

  /**
   * Creates a new web search tool instance
   * @param config - Configuration object containing Gemini API settings
   */
  constructor(private readonly config: Config) {
    super(
      WebSearchTool.Name,
      'GoogleSearch',
      'Performs a web search using Google Search (via the Gemini API) and returns the results. This tool is useful for finding information on the internet based on a query.',
      Kind.Search,
      {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query to find information on the web.',
          },
        },
        required: ['query'],
      },
    );
  }

  /**
   * Validates the parameters for the WebSearchTool.
   * @param params The parameters to validate
   * @returns An error message string if validation fails, null if valid
   */
  protected override validateToolParamValues(
    params: WebSearchToolParams,
  ): string | null {
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
  protected createInvocation(
    params: WebSearchToolParams,
  ): ToolInvocation<WebSearchToolParams, WebSearchToolResult> {
    return new WebSearchToolInvocation(this.config, params);
  }
}
