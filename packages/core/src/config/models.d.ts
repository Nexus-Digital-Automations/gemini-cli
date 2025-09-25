/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/** Default Gemini Flash model for fast, cost-effective conversations (Flash-first approach) */
export declare const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
/** Default Gemini Flash model for faster, cost-effective conversations */
export declare const DEFAULT_GEMINI_FLASH_MODEL = "gemini-2.5-flash";
/** Default Gemini Flash Lite model for ultra-fast, minimal cost conversations */
export declare const DEFAULT_GEMINI_FLASH_LITE_MODEL = "gemini-2.5-flash-lite";
/** Auto model selection identifier for dynamic model routing */
export declare const DEFAULT_GEMINI_MODEL_AUTO = "auto";
/** Default embedding model for vector operations and semantic search */
export declare const DEFAULT_GEMINI_EMBEDDING_MODEL = "gemini-embedding-001";
/** Default thinking mode setting (-1 enables dynamic thinking for models that support it) */
export declare const DEFAULT_THINKING_MODE = -1;
/**
 * Determines the effective model to use, applying fallback logic if necessary.
 *
 * When fallback mode is active, this function enforces the use of the standard
 * fallback model. However, it makes an exception for "lite" models (any model
 * with "lite" in its name), allowing them to be used to preserve cost savings.
 * This ensures that "pro" models are always downgraded, while "lite" model
 * requests are honored.
 *
 * @param isInFallbackMode Whether the application is in fallback mode.
 * @param requestedModel The model that was originally requested.
 * @returns The effective model name.
 */
export declare function getEffectiveModel(isInFallbackMode: boolean, requestedModel: string): string;
