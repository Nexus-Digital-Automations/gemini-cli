/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Interactive Debugging Assistance System - Core Types
 * Comprehensive type definitions for intelligent debugging and error analysis
 *
 * @author Claude Code - Interactive Debugging Assistant
 * @version 1.0.0
 */
/**
 * Types of errors the system can analyze
 */
export let ErrorType = {};
(function (ErrorType) {
  ErrorType['SYNTAX'] = 'syntax';
  ErrorType['RUNTIME'] = 'runtime';
  ErrorType['TYPE_ERROR'] = 'type_error';
  ErrorType['LOGIC'] = 'logic';
  ErrorType['PERFORMANCE'] = 'performance';
  ErrorType['MEMORY'] = 'memory';
  ErrorType['NETWORK'] = 'network';
  ErrorType['DATABASE'] = 'database';
  ErrorType['AUTHENTICATION'] = 'authentication';
  ErrorType['PERMISSION'] = 'permission';
  ErrorType['CONFIGURATION'] = 'configuration';
  ErrorType['DEPENDENCY'] = 'dependency';
  ErrorType['BUILD'] = 'build';
  ErrorType['TEST'] = 'test';
  ErrorType['UNKNOWN'] = 'unknown';
})(ErrorType || (ErrorType = {}));
/**
 * Severity levels for errors
 */
export let ErrorSeverity = {};
(function (ErrorSeverity) {
  ErrorSeverity['CRITICAL'] = 'critical';
  ErrorSeverity['HIGH'] = 'high';
  ErrorSeverity['MEDIUM'] = 'medium';
  ErrorSeverity['LOW'] = 'low';
  ErrorSeverity['INFO'] = 'info';
})(ErrorSeverity || (ErrorSeverity = {}));
/**
 * Programming languages supported
 */
export let SupportedLanguage = {};
(function (SupportedLanguage) {
  SupportedLanguage['JAVASCRIPT'] = 'javascript';
  SupportedLanguage['TYPESCRIPT'] = 'typescript';
  SupportedLanguage['PYTHON'] = 'python';
  SupportedLanguage['JAVA'] = 'java';
  SupportedLanguage['GO'] = 'go';
  SupportedLanguage['RUST'] = 'rust';
  SupportedLanguage['CPP'] = 'cpp';
  SupportedLanguage['C'] = 'c';
  SupportedLanguage['CSHARP'] = 'csharp';
  SupportedLanguage['PHP'] = 'php';
  SupportedLanguage['RUBY'] = 'ruby';
  SupportedLanguage['SHELL'] = 'shell';
  SupportedLanguage['SQL'] = 'sql';
  SupportedLanguage['UNKNOWN'] = 'unknown';
})(SupportedLanguage || (SupportedLanguage = {}));
/**
 * Priority levels for fixes
 */
export let FixPriority = {};
(function (FixPriority) {
  FixPriority['IMMEDIATE'] = 'immediate';
  FixPriority['HIGH'] = 'high';
  FixPriority['MEDIUM'] = 'medium';
  FixPriority['LOW'] = 'low';
  FixPriority['OPTIONAL'] = 'optional';
})(FixPriority || (FixPriority = {}));
/**
 * Categories of fixes
 */
export let FixCategory = {};
(function (FixCategory) {
  FixCategory['QUICK_FIX'] = 'quick_fix';
  FixCategory['REFACTOR'] = 'refactor';
  FixCategory['CONFIGURATION'] = 'configuration';
  FixCategory['DEPENDENCY'] = 'dependency';
  FixCategory['ARCHITECTURAL'] = 'architectural';
  FixCategory['PERFORMANCE'] = 'performance';
  FixCategory['SECURITY'] = 'security';
  FixCategory['TESTING'] = 'testing';
})(FixCategory || (FixCategory = {}));
/**
 * Types of code changes
 */
export let ChangeType = {};
(function (ChangeType) {
  ChangeType['INSERT'] = 'insert';
  ChangeType['REPLACE'] = 'replace';
  ChangeType['DELETE'] = 'delete';
  ChangeType['MOVE'] = 'move';
  ChangeType['RENAME'] = 'rename';
})(ChangeType || (ChangeType = {}));
/**
 * Scope of impact
 */
export let ImpactScope = {};
(function (ImpactScope) {
  ImpactScope['FILE'] = 'file';
  ImpactScope['MODULE'] = 'module';
  ImpactScope['PACKAGE'] = 'package';
  ImpactScope['PROJECT'] = 'project';
  ImpactScope['SYSTEM'] = 'system';
})(ImpactScope || (ImpactScope = {}));
/**
 * Variable scope information
 */
export let VariableScope = {};
(function (VariableScope) {
  VariableScope['GLOBAL'] = 'global';
  VariableScope['MODULE'] = 'module';
  VariableScope['FUNCTION'] = 'function';
  VariableScope['BLOCK'] = 'block';
  VariableScope['CLASS'] = 'class';
  VariableScope['CLOSURE'] = 'closure';
})(VariableScope || (VariableScope = {}));
/**
 * Types of error relationships
 */
export let ErrorRelationship = {};
(function (ErrorRelationship) {
  ErrorRelationship['DUPLICATE'] = 'duplicate';
  ErrorRelationship['SIMILAR'] = 'similar';
  ErrorRelationship['RELATED'] = 'related';
  ErrorRelationship['CAUSED_BY'] = 'caused_by';
  ErrorRelationship['CAUSES'] = 'causes';
  ErrorRelationship['SEQUENCE'] = 'sequence';
})(ErrorRelationship || (ErrorRelationship = {}));
/**
 * Log levels for generated logging
 */
export let LogLevel = {};
(function (LogLevel) {
  LogLevel['DEBUG'] = 'debug';
  LogLevel['INFO'] = 'info';
  LogLevel['WARN'] = 'warn';
  LogLevel['ERROR'] = 'error';
  LogLevel['TRACE'] = 'trace';
})(LogLevel || (LogLevel = {}));
/**
 * Breakpoint priority levels
 */
export let BreakpointPriority = {};
(function (BreakpointPriority) {
  BreakpointPriority['CRITICAL'] = 'critical';
  BreakpointPriority['HIGH'] = 'high';
  BreakpointPriority['MEDIUM'] = 'medium';
  BreakpointPriority['LOW'] = 'low';
})(BreakpointPriority || (BreakpointPriority = {}));
/**
 * Types of breakpoint actions
 */
export let BreakpointActionType = {};
(function (BreakpointActionType) {
  BreakpointActionType['LOG_VARIABLES'] = 'log_variables';
  BreakpointActionType['EVALUATE_EXPRESSION'] = 'evaluate_expression';
  BreakpointActionType['CALL_FUNCTION'] = 'call_function';
  BreakpointActionType['MODIFY_VARIABLE'] = 'modify_variable';
  BreakpointActionType['CONTINUE'] = 'continue';
  BreakpointActionType['STEP_OVER'] = 'step_over';
  BreakpointActionType['STEP_INTO'] = 'step_into';
})(BreakpointActionType || (BreakpointActionType = {}));
/**
 * Variable tracking methods
 */
export let TrackingMethod = {};
(function (TrackingMethod) {
  TrackingMethod['WATCH'] = 'watch';
  TrackingMethod['LOG_CHANGES'] = 'log_changes';
  TrackingMethod['HISTORY'] = 'history';
  TrackingMethod['BREAKPOINT'] = 'breakpoint';
})(TrackingMethod || (TrackingMethod = {}));
/**
 * Performance metrics to measure
 */
export let PerformanceMetric = {};
(function (PerformanceMetric) {
  PerformanceMetric['EXECUTION_TIME'] = 'execution_time';
  PerformanceMetric['MEMORY_USAGE'] = 'memory_usage';
  PerformanceMetric['CPU_USAGE'] = 'cpu_usage';
  PerformanceMetric['NETWORK_CALLS'] = 'network_calls';
  PerformanceMetric['DATABASE_QUERIES'] = 'database_queries';
  PerformanceMetric['FILE_IO'] = 'file_io';
})(PerformanceMetric || (PerformanceMetric = {}));
/**
 * Types of generated tests
 */
export let TestType = {};
(function (TestType) {
  TestType['UNIT'] = 'unit';
  TestType['INTEGRATION'] = 'integration';
  TestType['REGRESSION'] = 'regression';
  TestType['ERROR_REPRODUCTION'] = 'error_reproduction';
  TestType['EDGE_CASE'] = 'edge_case';
})(TestType || (TestType = {}));
/**
 * Types of test outputs
 */
export let TestOutputType = {};
(function (TestOutputType) {
  TestOutputType['RETURN_VALUE'] = 'return_value';
  TestOutputType['EXCEPTION'] = 'exception';
  TestOutputType['SIDE_EFFECT'] = 'side_effect';
  TestOutputType['STATE_CHANGE'] = 'state_change';
  TestOutputType['LOG_OUTPUT'] = 'log_output';
})(TestOutputType || (TestOutputType = {}));
/**
 * Types of assertions
 */
export let AssertionType = {};
(function (AssertionType) {
  AssertionType['EQUALS'] = 'equals';
  AssertionType['NOT_EQUALS'] = 'not_equals';
  AssertionType['TRUE'] = 'true';
  AssertionType['FALSE'] = 'false';
  AssertionType['NULL'] = 'null';
  AssertionType['NOT_NULL'] = 'not_null';
  AssertionType['GREATER_THAN'] = 'greater_than';
  AssertionType['LESS_THAN'] = 'less_than';
  AssertionType['CONTAINS'] = 'contains';
  AssertionType['INSTANCE_OF'] = 'instance_of';
})(AssertionType || (AssertionType = {}));
/**
 * Types of alert actions
 */
export let AlertActionType = {};
(function (AlertActionType) {
  AlertActionType['LOG'] = 'log';
  AlertActionType['EMAIL'] = 'email';
  AlertActionType['WEBHOOK'] = 'webhook';
  AlertActionType['SLACK'] = 'slack';
  AlertActionType['SMS'] = 'sms';
  AlertActionType['DESKTOP_NOTIFICATION'] = 'desktop_notification';
  AlertActionType['EXECUTE_COMMAND'] = 'execute_command';
})(AlertActionType || (AlertActionType = {}));
/**
 * Debug session states
 */
export let DebugState = {};
(function (DebugState) {
  DebugState['INITIALIZING'] = 'initializing';
  DebugState['RUNNING'] = 'running';
  DebugState['PAUSED'] = 'paused';
  DebugState['STEPPING'] = 'stepping';
  DebugState['ANALYZING'] = 'analyzing';
  DebugState['TERMINATED'] = 'terminated';
  DebugState['ERROR'] = 'error';
})(DebugState || (DebugState = {}));
/**
 * Types of debug targets
 */
export let DebugTargetType = {};
(function (DebugTargetType) {
  DebugTargetType['PROCESS'] = 'process';
  DebugTargetType['NODE_APP'] = 'node_app';
  DebugTargetType['BROWSER'] = 'browser';
  DebugTargetType['PYTHON_APP'] = 'python_app';
  DebugTargetType['JAVA_APP'] = 'java_app';
  DebugTargetType['REMOTE'] = 'remote';
})(DebugTargetType || (DebugTargetType = {}));
/**
 * Types of variable filters
 */
export let VariableFilterType = {};
(function (VariableFilterType) {
  VariableFilterType['INCLUDE'] = 'include';
  VariableFilterType['EXCLUDE'] = 'exclude';
  VariableFilterType['HIGHLIGHT'] = 'highlight';
  VariableFilterType['WATCH'] = 'watch';
})(VariableFilterType || (VariableFilterType = {}));
/**
 * Types of debug suggestions
 */
export let DebugSuggestionType = {};
(function (DebugSuggestionType) {
  DebugSuggestionType['NEXT_STEP'] = 'next_step';
  DebugSuggestionType['VARIABLE_INSPECTION'] = 'variable_inspection';
  DebugSuggestionType['BREAKPOINT'] = 'breakpoint';
  DebugSuggestionType['CODE_CHANGE'] = 'code_change';
  DebugSuggestionType['EXECUTION_PATH'] = 'execution_path';
  DebugSuggestionType['PERFORMANCE'] = 'performance';
  DebugSuggestionType['TESTING'] = 'testing';
})(DebugSuggestionType || (DebugSuggestionType = {}));
/**
 * Suggestion priority levels
 */
export let SuggestionPriority = {};
(function (SuggestionPriority) {
  SuggestionPriority['URGENT'] = 'urgent';
  SuggestionPriority['HIGH'] = 'high';
  SuggestionPriority['MEDIUM'] = 'medium';
  SuggestionPriority['LOW'] = 'low';
  SuggestionPriority['OPTIONAL'] = 'optional';
})(SuggestionPriority || (SuggestionPriority = {}));
/**
 * Types of debug actions
 */
export let DebugActionType = {};
(function (DebugActionType) {
  DebugActionType['STEP_OVER'] = 'step_over';
  DebugActionType['STEP_INTO'] = 'step_into';
  DebugActionType['STEP_OUT'] = 'step_out';
  DebugActionType['CONTINUE'] = 'continue';
  DebugActionType['PAUSE'] = 'pause';
  DebugActionType['SET_BREAKPOINT'] = 'set_breakpoint';
  DebugActionType['REMOVE_BREAKPOINT'] = 'remove_breakpoint';
  DebugActionType['EVALUATE_EXPRESSION'] = 'evaluate_expression';
  DebugActionType['INSPECT_VARIABLE'] = 'inspect_variable';
  DebugActionType['MODIFY_VARIABLE'] = 'modify_variable';
  DebugActionType['ADD_WATCH'] = 'add_watch';
  DebugActionType['REMOVE_WATCH'] = 'remove_watch';
  DebugActionType['RESTART'] = 'restart';
  DebugActionType['TERMINATE'] = 'terminate';
})(DebugActionType || (DebugActionType = {}));
//# sourceMappingURL=types.js.map
