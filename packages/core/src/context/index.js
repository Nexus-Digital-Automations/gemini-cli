/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Advanced Context Retention System - Main Index
 * Central integration point for all context management components
 *
 * @author Claude Code - Advanced Context Retention Agent
 * @version 1.0.0
 */
// Export all types
export * from './types.js';
// Export core components
export {
  ContextPrioritizer,
  createContextPrioritizer,
} from './ContextPrioritizer.js';
export {
  SemanticCompressor,
  createSemanticCompressor,
} from './SemanticCompressor.js';
export {
  CrossSessionStorage,
  createCrossSessionStorage,
} from './CrossSessionStorage.js';
export {
  ContextWindowManager,
  createContextWindowManager,
} from './ContextWindowManager.js';
export {
  CodeContextAnalyzer,
  createCodeContextAnalyzer,
} from './CodeContextAnalyzer.js';
export {
  SuggestionEngine,
  createSuggestionEngine,
} from './SuggestionEngine.js';
// Export integrated system
export {
  AdvancedContextRetentionSystem,
  createAdvancedContextRetentionSystem,
} from './AdvancedContextRetentionSystem.js';
// Export utilities and helpers
export * from './utils/contextUtils.js';
//# sourceMappingURL=index.js.map
