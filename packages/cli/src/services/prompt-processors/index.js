/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Public API exports for prompt-processors module
export { DefaultArgumentProcessor } from './argumentProcessor.js';
export { ShellProcessor, ConfirmationRequiredError } from './shellProcessor.js';
export { AtFileProcessor } from './atFileProcessor.js';
export { extractInjections } from './injectionParser.js';
// Note: TypeScript type exports not available in JavaScript files
export {
  SHORTHAND_ARGS_PLACEHOLDER,
  SHELL_INJECTION_TRIGGER,
  AT_FILE_INJECTION_TRIGGER,
} from './types.js';
