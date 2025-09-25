/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { GroundingMetadata } from '@google/genai';
import type { ToolInvocation, ToolResult } from './tools.js';
import { BaseDeclarativeTool } from './tools.js';
import { type Config } from '../config/config.js';
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
  sources?: GroundingMetadata extends {
    groundingChunks: GroundingChunkItem[];
  }
    ? GroundingMetadata['groundingChunks']
    : GroundingChunkItem[];
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
export declare class WebSearchTool extends BaseDeclarativeTool<
  WebSearchToolParams,
  WebSearchToolResult
> {
  private readonly config;
  /** Tool identifier for registration and configuration */
  static readonly Name: string;
  /**
   * Creates a new web search tool instance
   * @param config - Configuration object containing Gemini API settings
   */
  constructor(config: Config);
  /**
   * Validates the parameters for the WebSearchTool.
   * @param params The parameters to validate
   * @returns An error message string if validation fails, null if valid
   */
  protected validateToolParamValues(params: WebSearchToolParams): string | null;
  /**
   * Creates a web search tool invocation instance
   * @param params - Validated web search parameters
   * @returns Configured web search invocation ready for execution
   */
  protected createInvocation(
    params: WebSearchToolParams,
  ): ToolInvocation<WebSearchToolParams, WebSearchToolResult>;
}
export {};
