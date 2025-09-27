/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Autonomous system exports
 * Autonomous task execution and breakdown system
 */

// Autonomous execution components
export { AutonomousExecutionEngine as ExecutionEngine } from './execution-engine.js';
export { ComprehensiveStateManager as StateManager } from './state-manager.js';
export { ComprehensiveValidationEngine as ValidationEngine } from './validation-engine.js';

// Task breakdown and analysis
export { TaskBreakdownEngine } from './task-breakdown-engine.js';
export {
  LinguisticComplexityAnalyzer,
  WorkspaceComplexityAnalyzer,
  ToolComplexityAnalyzer,
  DependencyComplexityAnalyzer,
  ComplexityAnalyzers,
} from './complexity-analyzers.js';

// TaskManager integration
export { AutonomousTaskManagerIntegration as TaskManagerIntegration } from './taskmanager-integration.js';
