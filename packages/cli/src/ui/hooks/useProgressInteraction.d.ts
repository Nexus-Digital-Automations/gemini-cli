/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UseProgressInteractionOptions {
  enabled?: boolean;
  allowKeyboardControl?: boolean;
}
/**
 * Hook that handles keyboard interactions for progress management
 */
export declare const useProgressInteraction: (
  options?: UseProgressInteractionOptions,
) => {
  hasActiveOperation: boolean;
  canPause: boolean;
  canCancel: boolean;
  isPaused: boolean;
};
