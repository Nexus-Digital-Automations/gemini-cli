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
export enum ErrorType {
  SYNTAX = 'syntax',
  RUNTIME = 'runtime',
  TYPE_ERROR = 'type_error',
  LOGIC = 'logic',
  PERFORMANCE = 'performance',
  MEMORY = 'memory',
  NETWORK = 'network',
  DATABASE = 'database',
  AUTHENTICATION = 'authentication',
  PERMISSION = 'permission',
  CONFIGURATION = 'configuration',
  DEPENDENCY = 'dependency',
  BUILD = 'build',
  TEST = 'test',
  UNKNOWN = 'unknown',
}

/**
 * Severity levels for errors
 */
export enum ErrorSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

/**
 * Programming languages supported
 */
export enum SupportedLanguage {
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  PYTHON = 'python',
  JAVA = 'java',
  GO = 'go',
  RUST = 'rust',
  CPP = 'cpp',
  C = 'c',
  CSHARP = 'csharp',
  PHP = 'php',
  RUBY = 'ruby',
  SHELL = 'shell',
  SQL = 'sql',
  UNKNOWN = 'unknown',
}

/**
 * Error location information
 */
export interface ErrorLocation {
  /** File path where error occurred */
  filePath: string;
  /** Line number (1-based) */
  line?: number;
  /** Column number (1-based) */
  column?: number;
  /** Function or method name */
  functionName?: string;
  /** Class name if applicable */
  className?: string;
  /** Module or namespace */
  moduleName?: string;
}

/**
 * Core error analysis result
 */
export interface ErrorAnalysis {
  /** Unique identifier for this analysis */
  id: string;
  /** Type of error detected */
  errorType: ErrorType;
  /** Severity assessment */
  severity: ErrorSeverity;
  /** Programming language */
  language: SupportedLanguage;
  /** Original error message */
  originalMessage: string;
  /** Enhanced, user-friendly message */
  enhancedMessage: string;
  /** Location where error occurred */
  location: ErrorLocation;
  /** Root cause analysis */
  rootCause: string;
  /** Components affected by this error */
  affectedComponents: string[];
  /** Suggested fixes */
  suggestedFixes: FixSuggestion[];
  /** Confidence in analysis (0-1) */
  confidence: number;
  /** Analysis timestamp */
  timestamp: Date;
  /** Additional context */
  context: Record<string, unknown>;
}

/**
 * Fix suggestion with implementation details
 */
export interface FixSuggestion {
  /** Unique identifier */
  id: string;
  /** Human-readable description */
  description: string;
  /** Detailed explanation */
  explanation: string;
  /** Code changes required */
  codeChanges: CodeChange[];
  /** Confidence in fix success (0-1) */
  confidence: number;
  /** Impact assessment */
  impact: ImpactAssessment;
  /** Prerequisites for applying fix */
  prerequisites: string[];
  /** Potential risks */
  risks: string[];
  /** Estimated time to implement */
  estimatedTime: string;
  /** Priority level */
  priority: FixPriority;
  /** Category of fix */
  category: FixCategory;
}

/**
 * Priority levels for fixes
 */
export enum FixPriority {
  IMMEDIATE = 'immediate',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  OPTIONAL = 'optional',
}

/**
 * Categories of fixes
 */
export enum FixCategory {
  QUICK_FIX = 'quick_fix',
  REFACTOR = 'refactor',
  CONFIGURATION = 'configuration',
  DEPENDENCY = 'dependency',
  ARCHITECTURAL = 'architectural',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  TESTING = 'testing',
}

/**
 * Code change specification
 */
export interface CodeChange {
  /** File to modify */
  filePath: string;
  /** Type of change */
  changeType: ChangeType;
  /** Original code (for replacements) */
  originalCode?: string;
  /** New code to insert/replace */
  newCode: string;
  /** Line number for change */
  lineNumber?: number;
  /** Column position */
  columnNumber?: number;
  /** Description of change */
  description: string;
}

/**
 * Types of code changes
 */
export enum ChangeType {
  INSERT = 'insert',
  REPLACE = 'replace',
  DELETE = 'delete',
  MOVE = 'move',
  RENAME = 'rename',
}

/**
 * Impact assessment for fixes
 */
export interface ImpactAssessment {
  /** Scope of impact */
  scope: ImpactScope;
  /** Breaking changes flag */
  breakingChanges: boolean;
  /** Files that will be modified */
  affectedFiles: string[];
  /** Tests that need updates */
  testsRequiringUpdates: string[];
  /** Dependencies that might be affected */
  dependencyImpact: string[];
  /** Performance impact */
  performanceImpact: PerformanceImpact;
}

/**
 * Scope of impact
 */
export enum ImpactScope {
  FILE = 'file',
  MODULE = 'module',
  PACKAGE = 'package',
  PROJECT = 'project',
  SYSTEM = 'system',
}

/**
 * Performance impact assessment
 */
export interface PerformanceImpact {
  /** CPU impact (-100 to +100) */
  cpuImpact: number;
  /** Memory impact (-100 to +100) */
  memoryImpact: number;
  /** Network impact (-100 to +100) */
  networkImpact: number;
  /** Overall performance score */
  overallScore: number;
  /** Description of impact */
  description: string;
}

/**
 * Error pattern for recognition and learning
 */
export interface ErrorPattern {
  /** Unique pattern identifier */
  id: string;
  /** Pattern name */
  name: string;
  /** Description */
  description: string;
  /** Pattern matching regex or string */
  pattern: RegExp | string;
  /** Programming language */
  language: SupportedLanguage;
  /** Error type */
  errorType: ErrorType;
  /** Common causes */
  commonCauses: string[];
  /** Standard fix suggestions */
  suggestedFixes: FixSuggestion[];
  /** Confidence in pattern (0-1) */
  confidence: number;
  /** Frequency of occurrence */
  frequency: number;
  /** Last seen timestamp */
  lastSeen: Date;
  /** Tags for categorization */
  tags: string[];
}

/**
 * Stack frame information
 */
export interface StackFrame {
  /** Function or method name */
  functionName: string;
  /** File path */
  filePath: string;
  /** Line number */
  lineNumber?: number;
  /** Column number */
  columnNumber?: number;
  /** Arguments passed to function */
  arguments?: unknown[];
  /** Local variables (if available) */
  localVariables?: VariableState[];
  /** Is this an async frame? */
  isAsync: boolean;
  /** Is this a native/built-in function? */
  isNative: boolean;
  /** Source code snippet */
  sourceSnippet?: string;
}

/**
 * Complete stack trace analysis
 */
export interface StackTraceAnalysis {
  /** Unique analysis identifier */
  id: string;
  /** Original stack trace text */
  originalTrace: string;
  /** Parsed stack frames */
  frames: StackFrame[];
  /** Frame where error originated */
  errorOrigin: StackFrame;
  /** Error propagation path */
  propagationPath: string[];
  /** Variable states at different frames */
  variableStates: VariableStateMap;
  /** Analysis recommendations */
  recommendations: string[];
  /** Related errors or patterns */
  relatedErrors: ErrorReference[];
  /** Confidence in analysis */
  confidence: number;
}

/**
 * Variable state information
 */
export interface VariableState {
  /** Variable name */
  name: string;
  /** Variable type */
  type: string;
  /** Current value */
  value: unknown;
  /** Value representation as string */
  valueString: string;
  /** Is value defined? */
  isDefined: boolean;
  /** Scope information */
  scope: VariableScope;
  /** Last modified location */
  lastModified?: ErrorLocation;
}

/**
 * Variable scope information
 */
export enum VariableScope {
  GLOBAL = 'global',
  MODULE = 'module',
  FUNCTION = 'function',
  BLOCK = 'block',
  CLASS = 'class',
  CLOSURE = 'closure',
}

/**
 * Map of variable states by frame
 */
export type VariableStateMap = Record<string, VariableState[]>;

/**
 * Reference to related errors
 */
export interface ErrorReference {
  /** Error identifier */
  errorId: string;
  /** Error message */
  message: string;
  /** Relationship type */
  relationshipType: ErrorRelationship;
  /** Similarity score (0-1) */
  similarity: number;
  /** Timestamp */
  timestamp: Date;
}

/**
 * Types of error relationships
 */
export enum ErrorRelationship {
  DUPLICATE = 'duplicate',
  SIMILAR = 'similar',
  RELATED = 'related',
  CAUSED_BY = 'caused_by',
  CAUSES = 'causes',
  SEQUENCE = 'sequence',
}

/**
 * Debug code generation options
 */
export interface DebugCodeGeneration {
  /** Logging statements to insert */
  loggingStatements: LoggingStatement[];
  /** Breakpoint suggestions */
  breakpoints: BreakpointSuggestion[];
  /** Variable tracking code */
  variableTrackers: VariableTracker[];
  /** Performance measurement code */
  performanceMarkers: PerformanceMarker[];
  /** Generated test cases */
  testCases: TestCase[];
  /** Assertions to add */
  assertions: AssertionStatement[];
}

/**
 * Logging statement specification
 */
export interface LoggingStatement {
  /** Location to insert logging */
  location: ErrorLocation;
  /** Log level */
  level: LogLevel;
  /** Message to log */
  message: string;
  /** Variables to include */
  variables: string[];
  /** Generated code */
  code: string;
  /** Description */
  description: string;
}

/**
 * Log levels for generated logging
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  TRACE = 'trace',
}

/**
 * Breakpoint suggestion
 */
export interface BreakpointSuggestion {
  /** Location for breakpoint */
  location: ErrorLocation;
  /** Condition for conditional breakpoint */
  condition?: string;
  /** Reason for breakpoint */
  reason: string;
  /** Priority of this breakpoint */
  priority: BreakpointPriority;
  /** Actions to take when hit */
  actions: BreakpointAction[];
}

/**
 * Breakpoint priority levels
 */
export enum BreakpointPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * Actions to take when breakpoint is hit
 */
export interface BreakpointAction {
  /** Action type */
  type: BreakpointActionType;
  /** Action parameters */
  parameters: Record<string, unknown>;
  /** Description */
  description: string;
}

/**
 * Types of breakpoint actions
 */
export enum BreakpointActionType {
  LOG_VARIABLES = 'log_variables',
  EVALUATE_EXPRESSION = 'evaluate_expression',
  CALL_FUNCTION = 'call_function',
  MODIFY_VARIABLE = 'modify_variable',
  CONTINUE = 'continue',
  STEP_OVER = 'step_over',
  STEP_INTO = 'step_into',
}

/**
 * Variable tracking specification
 */
export interface VariableTracker {
  /** Variable name to track */
  variableName: string;
  /** Locations to track at */
  trackingPoints: ErrorLocation[];
  /** Tracking method */
  method: TrackingMethod;
  /** Generated tracking code */
  code: string;
  /** Description */
  description: string;
}

/**
 * Variable tracking methods
 */
export enum TrackingMethod {
  WATCH = 'watch',
  LOG_CHANGES = 'log_changes',
  HISTORY = 'history',
  BREAKPOINT = 'breakpoint',
}

/**
 * Performance measurement marker
 */
export interface PerformanceMarker {
  /** Marker name */
  name: string;
  /** Start location */
  startLocation: ErrorLocation;
  /** End location */
  endLocation: ErrorLocation;
  /** Metric to measure */
  metric: PerformanceMetric;
  /** Generated code */
  code: string;
  /** Description */
  description: string;
}

/**
 * Performance metrics to measure
 */
export enum PerformanceMetric {
  EXECUTION_TIME = 'execution_time',
  MEMORY_USAGE = 'memory_usage',
  CPU_USAGE = 'cpu_usage',
  NETWORK_CALLS = 'network_calls',
  DATABASE_QUERIES = 'database_queries',
  FILE_IO = 'file_io',
}

/**
 * Generated test case
 */
export interface TestCase {
  /** Test name */
  name: string;
  /** Test description */
  description: string;
  /** Test type */
  type: TestType;
  /** Generated test code */
  code: string;
  /** Input data for test */
  inputs: TestInput[];
  /** Expected outputs */
  expectedOutputs: TestOutput[];
  /** Setup code */
  setup?: string;
  /** Teardown code */
  teardown?: string;
}

/**
 * Types of generated tests
 */
export enum TestType {
  UNIT = 'unit',
  INTEGRATION = 'integration',
  REGRESSION = 'regression',
  ERROR_REPRODUCTION = 'error_reproduction',
  EDGE_CASE = 'edge_case',
}

/**
 * Test input specification
 */
export interface TestInput {
  /** Parameter name */
  name: string;
  /** Input value */
  value: unknown;
  /** Value type */
  type: string;
  /** Description */
  description: string;
}

/**
 * Expected test output
 */
export interface TestOutput {
  /** Output type */
  type: TestOutputType;
  /** Expected value */
  value: unknown;
  /** Validation method */
  validation: string;
  /** Description */
  description: string;
}

/**
 * Types of test outputs
 */
export enum TestOutputType {
  RETURN_VALUE = 'return_value',
  EXCEPTION = 'exception',
  SIDE_EFFECT = 'side_effect',
  STATE_CHANGE = 'state_change',
  LOG_OUTPUT = 'log_output',
}

/**
 * Assertion statement for testing
 */
export interface AssertionStatement {
  /** Location to insert assertion */
  location: ErrorLocation;
  /** Assertion type */
  type: AssertionType;
  /** Expression to assert */
  expression: string;
  /** Expected value */
  expectedValue?: unknown;
  /** Error message if assertion fails */
  errorMessage: string;
  /** Generated code */
  code: string;
}

/**
 * Types of assertions
 */
export enum AssertionType {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  TRUE = 'true',
  FALSE = 'false',
  NULL = 'null',
  NOT_NULL = 'not_null',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  CONTAINS = 'contains',
  INSTANCE_OF = 'instance_of',
}

/**
 * Real-time error monitoring configuration
 */
export interface ErrorMonitorConfig {
  /** Paths to monitor */
  watchPaths: string[];
  /** File patterns to monitor */
  filePatterns: string[];
  /** Performance thresholds */
  performanceThresholds: PerformanceThresholds;
  /** Alert rules */
  alertRules: AlertRule[];
  /** Sampling rate (0-1) */
  samplingRate: number;
  /** Buffer size for error storage */
  bufferSize: number;
  /** Monitoring interval in ms */
  monitoringInterval: number;
  /** Enable real-time analysis */
  enableRealTimeAnalysis: boolean;
}

/**
 * Performance thresholds for monitoring
 */
export interface PerformanceThresholds {
  /** CPU usage threshold (0-100) */
  cpuThreshold: number;
  /** Memory usage threshold in MB */
  memoryThreshold: number;
  /** Response time threshold in ms */
  responseTimeThreshold: number;
  /** Error rate threshold (0-1) */
  errorRateThreshold: number;
  /** Network timeout threshold in ms */
  networkTimeoutThreshold: number;
}

/**
 * Alert rule configuration
 */
export interface AlertRule {
  /** Rule name */
  name: string;
  /** Condition to trigger alert */
  condition: string;
  /** Alert severity */
  severity: ErrorSeverity;
  /** Alert message template */
  messageTemplate: string;
  /** Actions to take */
  actions: AlertAction[];
  /** Cooldown period in ms */
  cooldownPeriod: number;
  /** Is rule enabled? */
  enabled: boolean;
}

/**
 * Alert action specification
 */
export interface AlertAction {
  /** Action type */
  type: AlertActionType;
  /** Action parameters */
  parameters: Record<string, unknown>;
  /** Description */
  description: string;
}

/**
 * Types of alert actions
 */
export enum AlertActionType {
  LOG = 'log',
  EMAIL = 'email',
  WEBHOOK = 'webhook',
  SLACK = 'slack',
  SMS = 'sms',
  DESKTOP_NOTIFICATION = 'desktop_notification',
  EXECUTE_COMMAND = 'execute_command',
}

/**
 * Debug session state
 */
export interface DebugSession {
  /** Unique session identifier */
  id: string;
  /** Current session state */
  state: DebugState;
  /** Target application/process */
  target: DebugTarget;
  /** Current execution frame */
  currentFrame: StackFrame;
  /** Variable inspector instance */
  variableInspector: VariableInspector;
  /** Current suggestions */
  suggestions: DebugSuggestion[];
  /** Action history */
  history: DebugAction[];
  /** Session configuration */
  config: DebugSessionConfig;
  /** Start time */
  startTime: Date;
  /** Last activity time */
  lastActivity: Date;
}

/**
 * Debug session states
 */
export enum DebugState {
  INITIALIZING = 'initializing',
  RUNNING = 'running',
  PAUSED = 'paused',
  STEPPING = 'stepping',
  ANALYZING = 'analyzing',
  TERMINATED = 'terminated',
  ERROR = 'error',
}

/**
 * Debug target specification
 */
export interface DebugTarget {
  /** Target type */
  type: DebugTargetType;
  /** Target identifier */
  identifier: string;
  /** Working directory */
  workingDirectory: string;
  /** Environment variables */
  environment: Record<string, string>;
  /** Command line arguments */
  arguments: string[];
  /** Port for remote debugging */
  port?: number;
}

/**
 * Types of debug targets
 */
export enum DebugTargetType {
  PROCESS = 'process',
  NODE_APP = 'node_app',
  BROWSER = 'browser',
  PYTHON_APP = 'python_app',
  JAVA_APP = 'java_app',
  REMOTE = 'remote',
}

/**
 * Variable inspector interface
 */
export interface VariableInspector {
  /** Current variables */
  variables: VariableState[];
  /** Watch expressions */
  watchExpressions: WatchExpression[];
  /** Variable filters */
  filters: VariableFilter[];
  /** Inspection history */
  history: VariableInspection[];
}

/**
 * Watch expression for variables
 */
export interface WatchExpression {
  /** Expression to evaluate */
  expression: string;
  /** Current value */
  value: unknown;
  /** Value type */
  type: string;
  /** Is expression valid? */
  isValid: boolean;
  /** Error if invalid */
  error?: string;
  /** Last evaluated */
  lastEvaluated: Date;
}

/**
 * Variable filter specification
 */
export interface VariableFilter {
  /** Filter name */
  name: string;
  /** Filter expression */
  expression: string;
  /** Is filter enabled? */
  enabled: boolean;
  /** Filter type */
  type: VariableFilterType;
}

/**
 * Types of variable filters
 */
export enum VariableFilterType {
  INCLUDE = 'include',
  EXCLUDE = 'exclude',
  HIGHLIGHT = 'highlight',
  WATCH = 'watch',
}

/**
 * Variable inspection record
 */
export interface VariableInspection {
  /** Variable name */
  variableName: string;
  /** Inspection time */
  timestamp: Date;
  /** Variable value at time */
  value: unknown;
  /** Stack frame context */
  frame: StackFrame;
  /** User notes */
  notes?: string;
}

/**
 * Debug suggestion for user
 */
export interface DebugSuggestion {
  /** Suggestion identifier */
  id: string;
  /** Suggestion text */
  suggestion: string;
  /** Suggestion type */
  type: DebugSuggestionType;
  /** Confidence level (0-1) */
  confidence: number;
  /** Reasoning behind suggestion */
  reasoning: string;
  /** Actions user can take */
  actions: DebugAction[];
  /** Priority level */
  priority: SuggestionPriority;
}

/**
 * Types of debug suggestions
 */
export enum DebugSuggestionType {
  NEXT_STEP = 'next_step',
  VARIABLE_INSPECTION = 'variable_inspection',
  BREAKPOINT = 'breakpoint',
  CODE_CHANGE = 'code_change',
  EXECUTION_PATH = 'execution_path',
  PERFORMANCE = 'performance',
  TESTING = 'testing',
}

/**
 * Suggestion priority levels
 */
export enum SuggestionPriority {
  URGENT = 'urgent',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  OPTIONAL = 'optional',
}

/**
 * Debug action that can be performed
 */
export interface DebugAction {
  /** Action identifier */
  id: string;
  /** Action type */
  type: DebugActionType;
  /** Action parameters */
  parameters: Record<string, unknown>;
  /** Action timestamp */
  timestamp: Date;
  /** Action result */
  result?: DebugActionResult;
  /** Description */
  description: string;
}

/**
 * Types of debug actions
 */
export enum DebugActionType {
  STEP_OVER = 'step_over',
  STEP_INTO = 'step_into',
  STEP_OUT = 'step_out',
  CONTINUE = 'continue',
  PAUSE = 'pause',
  SET_BREAKPOINT = 'set_breakpoint',
  REMOVE_BREAKPOINT = 'remove_breakpoint',
  EVALUATE_EXPRESSION = 'evaluate_expression',
  INSPECT_VARIABLE = 'inspect_variable',
  MODIFY_VARIABLE = 'modify_variable',
  ADD_WATCH = 'add_watch',
  REMOVE_WATCH = 'remove_watch',
  RESTART = 'restart',
  TERMINATE = 'terminate',
}

/**
 * Result of debug action
 */
export interface DebugActionResult {
  /** Was action successful? */
  success: boolean;
  /** Result value */
  value?: unknown;
  /** Error message if failed */
  error?: string;
  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Debug session configuration
 */
export interface DebugSessionConfig {
  /** Auto-step mode */
  autoStep: boolean;
  /** Step timeout in ms */
  stepTimeout: number;
  /** Maximum stack depth to show */
  maxStackDepth: number;
  /** Variable display limit */
  variableDisplayLimit: number;
  /** Enable performance monitoring */
  enablePerformanceMonitoring: boolean;
  /** Log level */
  logLevel: LogLevel;
  /** Custom debugger settings */
  debuggerSettings: Record<string, unknown>;
}

/**
 * Debugging system analytics
 */
export interface DebuggingAnalytics {
  /** Total errors analyzed */
  totalErrorsAnalyzed: number;
  /** Successful fixes applied */
  successfulFixes: number;
  /** Fix success rate */
  fixSuccessRate: number;
  /** Most common error types */
  commonErrorTypes: ErrorTypeFrequency[];
  /** Language distribution */
  languageDistribution: LanguageUsage[];
  /** Average analysis time */
  averageAnalysisTime: number;
  /** User satisfaction scores */
  satisfactionScores: number[];
  /** Performance metrics */
  performanceMetrics: PerformanceMetrics;
}

/**
 * Error type frequency data
 */
export interface ErrorTypeFrequency {
  /** Error type */
  errorType: ErrorType;
  /** Frequency count */
  count: number;
  /** Percentage of total */
  percentage: number;
}

/**
 * Language usage statistics
 */
export interface LanguageUsage {
  /** Programming language */
  language: SupportedLanguage;
  /** Usage count */
  count: number;
  /** Percentage of total */
  percentage: number;
  /** Average errors per project */
  averageErrorsPerProject: number;
}

/**
 * System performance metrics
 */
export interface PerformanceMetrics {
  /** Error analysis time in ms */
  analysisTime: number;
  /** Fix generation time in ms */
  fixGenerationTime: number;
  /** Memory usage in MB */
  memoryUsage: number;
  /** CPU usage percentage */
  cpuUsage: number;
  /** Cache hit rate */
  cacheHitRate: number;
}

/**
 * Language support types for debug code generation
 */
export type LanguageSupport =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'go'
  | 'rust'
  | 'cpp'
  | 'c'
  | 'csharp'
  | 'php'
  | 'ruby'
  | 'shell'
  | 'sql';

/**
 * Types of debug code that can be generated
 */
export type DebugCodeType =
  | 'logging'
  | 'testing'
  | 'performance'
  | 'error-handling'
  | 'validation'
  | 'instrumentation'
  | 'monitoring';

/**
 * Debug code template specification
 */
export interface DebugCodeTemplate {
  /** Unique template identifier */
  id: string;
  /** Template name */
  name: string;
  /** Template description */
  description: string;
  /** Code template with placeholders */
  template: string;
  /** Template complexity level */
  complexity: 'simple' | 'moderate' | 'complex';
  /** Required parameters */
  requiredParameters: string[];
  /** Optional parameters */
  optionalParameters?: string[];
  /** Usage examples */
  examples?: string[];
  /** Tags for categorization */
  tags: string[];
}

/**
 * Generated debug code snippet
 */
export interface DebugCodeSnippet {
  /** Unique snippet identifier */
  id: string;
  /** Generated code */
  code: string;
  /** Programming language */
  language: LanguageSupport;
  /** Code type */
  type?: DebugCodeType;
  /** Description */
  description?: string;
  /** Usage instructions */
  instructions?: string[];
  /** Implementation effort estimate */
  estimatedEffort?: string;
  /** Generated timestamp */
  timestamp?: Date;
}

/**
 * Instrumentation code specification
 */
export interface InstrumentationCode {
  /** Unique identifier */
  id: string;
  /** Target file or location */
  targetLocation: string;
  /** Programming language */
  language: LanguageSupport;
  /** Generated instrumentation code */
  code?: string;
  /** Instrumentation type */
  type?: 'logging' | 'performance' | 'error-handling' | 'all';
  /** Instructions for implementation */
  instructions?: string[];
  /** Estimated implementation time */
  estimatedTime?: string;
}

/**
 * Debug code generation options
 */
export interface DebugGenerationOptions {
  /** Type of debug code to generate */
  type: DebugCodeType;
  /** Target programming language */
  language: LanguageSupport;
  /** Context information */
  context?: {
    /** File path */
    filePath?: string;
    /** Function name */
    functionName?: string;
    /** Variable names */
    variables?: string[];
    /** Error context */
    errorContext?: string;
    /** Additional metadata */
    [key: string]: unknown;
  };
  /** Template preferences */
  templatePreferences?: {
    /** Complexity preference */
    complexity?: 'simple' | 'moderate' | 'complex';
    /** Include comments */
    includeComments?: boolean;
    /** Include error handling */
    includeErrorHandling?: boolean;
  };
  /** Output preferences */
  outputPreferences?: {
    /** Code style */
    codeStyle?: 'standard' | 'compact' | 'verbose';
    /** Include usage instructions */
    includeInstructions?: boolean;
    /** Include examples */
    includeExamples?: boolean;
  };
}

/**
 * Test case generation options
 */
export interface TestCaseGeneration {
  /** Test type to generate */
  testType: TestType;
  /** Target function or method */
  targetFunction?: string;
  /** Input parameters */
  parameters?: TestInput[];
  /** Expected outcomes */
  expectedResults?: TestOutput[];
  /** Test framework preference */
  framework?: string;
  /** Include edge cases */
  includeEdgeCases?: boolean;
  /** Include error scenarios */
  includeErrorScenarios?: boolean;
  /** Programming language */
  language?: LanguageSupport;
}
