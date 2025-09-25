/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { OperationProgress } from '../types.js';
export interface ContextualPhrase {
    message: string;
    isSpecific: boolean;
}
/**
 * Hook that provides contextual loading phrases based on the current operation
 */
export declare const useContextualPhrases: (operation?: OperationProgress) => ContextualPhrase;
