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
export declare enum ErrorType {
    SYNTAX = "syntax",
    RUNTIME = "runtime",
    TYPE_ERROR = "type_error",
    LOGIC = "logic",
    PERFORMANCE = "performance",
    MEMORY = "memory",
    NETWORK = "network",
    DATABASE = "database",
    AUTHENTICATION = "authentication",
    PERMISSION = "permission",
    CONFIGURATION = "configuration",
    DEPENDENCY = "dependency",
    BUILD = "build",
    TEST = "test",
    UNKNOWN = "unknown"
}
/**
 * Severity levels for errors
 */
export declare enum ErrorSeverity {
    CRITICAL = "critical",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low",
    INFO = "info"
}
/**
 * Impact levels for contextual factors
 */
export declare enum ImpactLevel {
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low"
}
/**
 * Programming languages supported
 */
export declare enum SupportedLanguage {
    JAVASCRIPT = "javascript",
    TYPESCRIPT = "typescript",
    PYTHON = "python",
    JAVA = "java",
    GO = "go",
    RUST = "rust",
    CPP = "cpp",
    C = "c",
    CSHARP = "csharp",
    PHP = "php",
    RUBY = "ruby",
    SHELL = "shell",
    SQL = "sql",
    GENERIC = "generic",
    UNKNOWN = "unknown"
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
    /** Error text for analysis */
    errorText?: string;
    /** Error category */
    category?: string;
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
    /** Analysis metadata */
    metadata?: Record<string, unknown>;
    /** Error signature */
    signature?: ErrorSignature;
    /** Related patterns */
    patterns?: ErrorPattern[];
    /** Fix suggestions (alias for suggestedFixes) */
    fixSuggestions?: FixSuggestion[];
}
/**
 * Fix suggestion with implementation details
 */
export interface FixSuggestion {
    /** Unique identifier */
    id: string;
    /** Fix title */
    title?: string;
    /** Human-readable description */
    description: string;
    /** Detailed explanation */
    explanation: string;
    /** Code changes required */
    codeChanges: CodeChange[];
    /** Confidence in fix success (0-1) */
    confidence: number;
    /** Fix complexity level */
    complexity?: string;
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
    /** Tags for categorization */
    tags?: string[];
    /** Source of the suggestion */
    source?: string;
    /** Additional metadata */
    metadata?: Record<string, unknown>;
    /** Fix validation criteria */
    validation?: FixValidation;
    /** Code transformation instructions */
    codeTransformation?: CodeTransformation;
    /** Command to execute for fix */
    command?: CommandSuggestion;
    /** Configuration changes */
    configurationChange?: unknown;
    /** Dependency changes */
    dependencyChange?: unknown;
}
/**
 * Priority levels for fixes
 */
export declare enum FixPriority {
    IMMEDIATE = "immediate",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low",
    OPTIONAL = "optional"
}
/**
 * Categories of fixes
 */
export declare enum FixCategory {
    QUICK_FIX = "quick_fix",
    REFACTOR = "refactor",
    CONFIGURATION = "configuration",
    DEPENDENCY = "dependency",
    ARCHITECTURAL = "architectural",
    PERFORMANCE = "performance",
    SECURITY = "security",
    TESTING = "testing",
    CODE_CHANGE = "code-change",
    COMMAND = "command"
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
export declare enum ChangeType {
    INSERT = "insert",
    REPLACE = "replace",
    DELETE = "delete",
    MOVE = "move",
    RENAME = "rename"
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
export declare enum ImpactScope {
    FILE = "file",
    MODULE = "module",
    COMPONENT = "component",
    LOCAL = "local",
    PACKAGE = "package",
    PROJECT = "project",
    SYSTEM = "system"
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
    /** Error category */
    category?: ErrorCategory;
    /** Error severity */
    severity?: ErrorSeverity;
    /** Whether the pattern is active */
    isActive?: boolean;
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
export declare enum VariableScope {
    GLOBAL = "global",
    MODULE = "module",
    FUNCTION = "function",
    BLOCK = "block",
    CLASS = "class",
    CLOSURE = "closure"
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
export declare enum ErrorRelationship {
    DUPLICATE = "duplicate",
    SIMILAR = "similar",
    RELATED = "related",
    CAUSED_BY = "caused_by",
    CAUSES = "causes",
    SEQUENCE = "sequence"
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
export declare enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
    TRACE = "trace"
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
export declare enum BreakpointPriority {
    CRITICAL = "critical",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low"
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
export declare enum BreakpointActionType {
    LOG_VARIABLES = "log_variables",
    EVALUATE_EXPRESSION = "evaluate_expression",
    CALL_FUNCTION = "call_function",
    MODIFY_VARIABLE = "modify_variable",
    CONTINUE = "continue",
    STEP_OVER = "step_over",
    STEP_INTO = "step_into"
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
export declare enum TrackingMethod {
    WATCH = "watch",
    LOG_CHANGES = "log_changes",
    HISTORY = "history",
    BREAKPOINT = "breakpoint"
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
export declare enum PerformanceMetric {
    EXECUTION_TIME = "execution_time",
    MEMORY_USAGE = "memory_usage",
    CPU_USAGE = "cpu_usage",
    NETWORK_CALLS = "network_calls",
    DATABASE_QUERIES = "database_queries",
    FILE_IO = "file_io"
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
export declare enum TestType {
    UNIT = "unit",
    INTEGRATION = "integration",
    REGRESSION = "regression",
    ERROR_REPRODUCTION = "error_reproduction",
    EDGE_CASE = "edge_case"
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
export declare enum TestOutputType {
    RETURN_VALUE = "return_value",
    EXCEPTION = "exception",
    SIDE_EFFECT = "side_effect",
    STATE_CHANGE = "state_change",
    LOG_OUTPUT = "log_output"
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
export declare enum AssertionType {
    EQUALS = "equals",
    NOT_EQUALS = "not_equals",
    TRUE = "true",
    FALSE = "false",
    NULL = "null",
    NOT_NULL = "not_null",
    GREATER_THAN = "greater_than",
    LESS_THAN = "less_than",
    CONTAINS = "contains",
    INSTANCE_OF = "instance_of"
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
    /** Rule identifier */
    id: string;
    /** Rule name */
    name: string;
    /** Rule description */
    description?: string;
    /** Condition to trigger alert */
    condition: {
        type: string;
        patternId?: string;
        threshold: number;
        timeWindow: number;
    };
    /** Alert severity */
    severity: ErrorSeverity | 'warning' | 'info';
    /** Alert message template */
    messageTemplate?: string;
    /** Actions to take */
    actions?: AlertAction[];
    /** Cooldown period in ms */
    cooldownPeriod?: number;
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
export declare enum AlertActionType {
    LOG = "log",
    EMAIL = "email",
    WEBHOOK = "webhook",
    SLACK = "slack",
    SMS = "sms",
    DESKTOP_NOTIFICATION = "desktop_notification",
    EXECUTE_COMMAND = "execute_command"
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
export declare enum DebugState {
    INITIALIZING = "initializing",
    RUNNING = "running",
    PAUSED = "paused",
    STEPPING = "stepping",
    ANALYZING = "analyzing",
    TERMINATED = "terminated",
    ERROR = "error"
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
export declare enum DebugTargetType {
    PROCESS = "process",
    NODE_APP = "node_app",
    BROWSER = "browser",
    PYTHON_APP = "python_app",
    JAVA_APP = "java_app",
    REMOTE = "remote"
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
export declare enum VariableFilterType {
    INCLUDE = "include",
    EXCLUDE = "exclude",
    HIGHLIGHT = "highlight",
    WATCH = "watch"
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
export declare enum DebugSuggestionType {
    NEXT_STEP = "next_step",
    VARIABLE_INSPECTION = "variable_inspection",
    BREAKPOINT = "breakpoint",
    CODE_CHANGE = "code_change",
    EXECUTION_PATH = "execution_path",
    PERFORMANCE = "performance",
    TESTING = "testing"
}
/**
 * Suggestion priority levels
 */
export declare enum SuggestionPriority {
    URGENT = "urgent",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low",
    OPTIONAL = "optional"
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
export declare enum DebugActionType {
    STEP_OVER = "step_over",
    STEP_INTO = "step_into",
    STEP_OUT = "step_out",
    CONTINUE = "continue",
    PAUSE = "pause",
    SET_BREAKPOINT = "set_breakpoint",
    REMOVE_BREAKPOINT = "remove_breakpoint",
    EVALUATE_EXPRESSION = "evaluate_expression",
    INSPECT_VARIABLE = "inspect_variable",
    MODIFY_VARIABLE = "modify_variable",
    ADD_WATCH = "add_watch",
    REMOVE_WATCH = "remove_watch",
    RESTART = "restart",
    TERMINATE = "terminate"
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
    /** Memory usage percentage */
    memoryUsage: number;
    /** CPU usage percentage */
    cpuUsage: number;
    /** Response time in ms */
    responseTime: number;
    /** Throughput requests per second */
    throughput: number;
    /** Error analysis time in ms */
    analysisTime?: number;
    /** Fix generation time in ms */
    fixGenerationTime?: number;
    /** Cache hit rate */
    cacheHitRate?: number;
    /** Performance impact assessment */
    impact?: string;
}
/**
 * Language support types for debug code generation
 */
export type LanguageSupport = 'javascript' | 'typescript' | 'python' | 'java' | 'go' | 'rust' | 'cpp' | 'c' | 'csharp' | 'php' | 'ruby' | 'shell' | 'sql';
/**
 * Types of debug code that can be generated
 */
export type DebugCodeType = 'logging' | 'testing' | 'performance' | 'error-handling' | 'validation' | 'instrumentation' | 'monitoring';
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
    complexity: 'simple' | 'moderate' | 'complex' | 'advanced';
    /** Template category */
    category?: string;
    /** Required parameters */
    requiredParameters: string[];
    /** Optional parameters */
    optionalParameters?: string[];
    /** Template parameters for substitution */
    parameters?: string[];
    /** Use cases for this template */
    useCases?: string[];
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
    /** Template used for generation */
    template?: string;
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
    /** Logging instrumentation configuration */
    loggingInstrumentation?: {
        description: string;
        placement: string;
        level?: string;
        format?: string;
    };
    /** Performance instrumentation configuration */
    performanceInstrumentation?: {
        description: string;
        placement: string;
        metrics?: string[];
        interval?: number;
    };
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
    /** Template ID to use for generation */
    templateId?: string;
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
        complexity?: 'simple' | 'moderate' | 'complex' | 'advanced';
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
/**
 * Error analysis context information
 */
export interface ErrorAnalysisContext {
    /** File path where error occurred */
    filePath?: string;
    /** Line number */
    lineNumber?: number;
    /** Column number */
    columnNumber?: number;
    /** Programming language */
    language?: LanguageSupport;
    /** Function name */
    functionName?: string;
    /** Stack trace */
    stackTrace?: string[];
    /** Environment information */
    environment?: Record<string, unknown>;
    /** Execution context */
    executionContext?: {
        environment?: string;
        [key: string]: unknown;
    };
    /** Project context */
    projectContext?: {
        framework?: string;
        [key: string]: unknown;
    };
    /** Index signature for Record compatibility */
    [key: string]: unknown;
}
/**
 * Error category classification
 */
export type ErrorCategory = 'syntax' | 'runtime' | 'logic' | 'performance' | 'security' | 'configuration' | 'network' | 'database' | 'validation' | 'import' | 'type' | 'unknown';
/**
 * Error signature for pattern matching
 */
export interface ErrorSignature {
    /** Unique signature identifier */
    id: string;
    /** Error pattern */
    pattern: string;
    /** Error patterns (array) */
    patterns: string[];
    /** Error category */
    category: ErrorCategory;
    /** Confidence score */
    confidence: number;
    /** Hash of error characteristics */
    hash: string;
}
/**
 * Additional error context
 */
export interface ErrorContext {
    /** Request context */
    request?: Record<string, unknown>;
    /** User context */
    user?: Record<string, unknown>;
    /** Session context */
    session?: Record<string, unknown>;
    /** Application state */
    state?: Record<string, unknown>;
}
/**
 * Analysis result container
 */
export interface AnalysisResult {
    /** Analysis identifier */
    id: string;
    /** Result data */
    data: Record<string, unknown>;
    /** Confidence score */
    confidence: number;
    /** Timestamp */
    timestamp: Date;
}
/**
 * Error insight information
 */
export interface ErrorInsight {
    /** Insight type */
    type: string;
    /** Description */
    description: string;
    /** Confidence */
    confidence: number;
    /** Supporting evidence */
    evidence?: string[];
}
/**
 * Contextual factor affecting error
 */
export interface ContextualFactor {
    /** Factor type */
    type: string;
    /** Factor name */
    name: string;
    /** Impact level */
    impact: ImpactLevel;
    /** Description */
    description: string;
}
/**
 * Related error information
 */
export interface RelatedError {
    /** Error ID */
    id: string;
    /** Error signature */
    signature: string;
    /** Similarity score */
    similarity: number;
    /** Relationship type */
    relationship: string;
    /** Error message */
    message: string;
}
/**
 * Error trend data
 */
export interface ErrorTrend {
    /** Time period */
    period: string;
    /** Frequency count */
    count: number;
    /** Trend direction */
    direction: 'increasing' | 'decreasing' | 'stable';
    /** Change percentage */
    changePercent: number;
    /** Detailed frequency data */
    frequency?: {
        last24h: number;
        last7d: number;
        last30d: number;
        total: number;
    };
    /** Severity level */
    severity?: string;
    /** Prediction about future trend */
    prediction?: string;
}
/**
 * Error frequency statistics
 */
export interface ErrorFrequencyData {
    /** Error signature */
    signature?: ErrorSignature;
    /** Total occurrences */
    total: number;
    /** Total count (alias for total) */
    totalCount: number;
    /** Daily frequency */
    daily: number[];
    /** Peak times */
    peakTimes: string[];
    /** Trend information */
    trend: ErrorTrend;
    /** Recent occurrences */
    occurrences?: Date[];
    /** First occurrence date */
    firstOccurrence?: Date;
    /** Last occurrence date */
    lastOccurrence?: Date;
    /** Last analysis timestamp */
    lastAnalysis?: Date;
}
/**
 * Similarity scoring data
 */
export interface SimilarityScore {
    /** Score value (0-1) */
    score: number;
    /** Comparison method */
    method: string;
    /** Contributing factors */
    factors: Record<string, number>;
    /** Overall similarity score */
    overall?: number;
    /** Text similarity score */
    textSimilarity?: number;
    /** Context similarity score */
    contextSimilarity?: number;
    /** Pattern similarity score */
    patternSimilarity?: number;
}
/**
 * Code quality metrics
 */
export interface CodeQualityMetrics {
    /** Complexity score */
    complexity: number;
    /** Coverage percentage */
    coverage: number;
    /** Maintainability index */
    maintainability: number;
    /** Technical debt ratio */
    technicalDebt: number;
}
/**
 * Security implications assessment
 */
export interface SecurityImplications {
    /** Risk level */
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    /** Security concerns */
    concerns: string[];
    /** Mitigation strategies */
    mitigations: string[];
    /** Compliance impact */
    complianceImpact?: string[];
    /** Security vulnerabilities */
    vulnerabilities: string[];
}
/**
 * Project impact assessment
 */
export interface ProjectImpact {
    /** Affected components */
    components: string[];
    /** Severity level */
    severity: ErrorSeverity;
    /** Estimated resolution time */
    estimatedTime: string;
    /** Business impact */
    businessImpact: string;
    /** Impact scope */
    scope: ImpactScope;
}
/**
 * Resource usage information
 */
export interface ResourceUsage {
    /** CPU usage percentage */
    cpu: number;
    /** Memory usage in MB */
    memory: number;
    /** Disk I/O operations */
    diskIO: number;
    /** Network usage */
    network: number;
}
/**
 * Error pattern match result
 */
export interface ErrorPatternMatch {
    /** Pattern identifier */
    patternId: string;
    /** Confidence score */
    confidence: number;
    /** Matched text segments */
    matches: string[];
    /** Match context */
    context?: Record<string, unknown>;
}
/**
 * Pattern matching result
 */
export interface PatternMatchResult {
    /** Pattern identifier */
    patternId: string;
    /** Matched pattern */
    pattern: ErrorPattern;
    /** Confidence score (0-1) */
    confidence: number;
    /** Matched text segments */
    matches: string[];
    /** Match location information */
    location?: {
        start: number;
        end: number;
        line?: number;
        column?: number;
    };
    /** Additional context */
    context?: Record<string, unknown>;
    /** Whether this is a match */
    isMatch: boolean;
}
/**
 * Pattern matching configuration
 */
export interface PatternMatchConfig {
    /** Minimum confidence threshold */
    minConfidence: number;
    /** Maximum number of results */
    maxResults: number;
    /** Enable fuzzy matching */
    fuzzyMatch: boolean;
    /** Case sensitive matching */
    caseSensitive: boolean;
    /** Additional matching options */
    options?: Record<string, unknown>;
}
/**
 * Pattern learning data
 */
export interface PatternLearningData {
    /** Original error text */
    errorText: string;
    /** Pattern matching results */
    matches: PatternMatchResult[];
    /** User feedback */
    userFeedback?: {
        correctMatch?: string;
        isCorrect?: boolean;
        confidence?: number;
    };
    /** Learning timestamp */
    timestamp: Date;
    /** Learning context */
    context?: ErrorAnalysisContext;
}
/**
 * Common error pattern (built-in patterns)
 */
export interface CommonErrorPattern extends ErrorPattern {
    /** Built-in pattern category */
    category: ErrorCategory;
    /** Pattern language */
    language: SupportedLanguage;
    /** Usage frequency */
    frequency: number;
    /** Pattern effectiveness score */
    effectiveness: number;
}
/**
 * Pattern statistics for tracking effectiveness and usage
 */
export interface PatternStats {
    /** Pattern identifier */
    patternId: string;
    /** Number of times pattern has matched */
    matchCount: number;
    /** Number of successful matches */
    successfulMatches: number;
    /** Number of false positive matches */
    falsePositives: number;
    /** Last time pattern was matched */
    lastMatched: Date;
    /** Average confidence score */
    averageConfidence: number;
    /** Overall effectiveness score (0-1) */
    effectiveness: number;
}
/**
 * Error frequency statistics (alias for ErrorFrequencyData)
 */
export type ErrorFrequencyStats = ErrorFrequencyData;
/**
 * Fix template for automated error resolution
 */
export interface FixTemplate {
    id: string;
    title: string;
    description: string;
    category: string;
    complexity: string;
    confidence?: number;
    codeTemplate?: string;
    commandTemplate?: string;
    fileTemplate?: string | {
        path: string;
        content: string;
    };
    applicableLanguages?: string[];
    placeholders?: Record<string, string>;
    validation?: FixValidation;
    dependencies?: string[];
    estimatedTime?: string;
    requirements?: string[];
    tags?: string[];
}
/**
 * Fix validation criteria
 */
export interface FixValidation {
    required: boolean;
    testCommand?: string;
    expectedOutput?: string;
    conditions?: string[];
    isValid?: boolean;
    warnings?: string[];
    requirements?: string[];
    safetyScore?: number;
    estimatedImpact?: string;
}
/**
 * Command suggestion for fixes
 */
export interface CommandSuggestion {
    command: string;
    description: string;
    args?: string[];
    workingDirectory?: string;
    platforms?: string[];
}
/**
 * Fix result after applying fix
 */
export interface FixResult {
    success: boolean;
    message: string;
    details?: Record<string, unknown>;
    errors?: string[];
    error?: string;
    appliedChanges?: unknown[];
    backupPath?: string;
    duration?: number;
}
/**
 * Automated fix configuration
 */
export interface AutomatedFix {
    id: string;
    enabled: boolean;
    confidence: number;
    validation: FixValidation;
}
/**
 * Fix complexity levels
 */
export type FixComplexity = 'simple' | 'moderate' | 'complex' | 'expert';
/**
 * Code transformation instructions
 */
export interface CodeTransformation {
    type: 'replace' | 'insert' | 'delete' | 'move';
    target: string;
    replacement?: string;
    position?: number;
}
/**
 * Fix confidence level
 */
export type FixConfidence = 'low' | 'medium' | 'high' | 'very-high';
/**
 * Configuration fix
 */
export interface ConfigurationFix {
    file: string;
    changes: Record<string, unknown>;
}
/**
 * Dependency fix
 */
export interface DependencyFix {
    package: string;
    action: 'install' | 'update' | 'remove';
    version?: string;
}
/**
 * Code snippet fix
 */
export interface CodeSnippetFix {
    language: string;
    code: string;
    description: string;
}
/**
 * Quick fix action
 */
export interface QuickFix {
    id: string;
    title: string;
    action: () => Promise<void>;
}
/**
 * Learning fix that improves over time
 */
export interface LearningFix {
    pattern: string;
    effectiveness: number;
    lastUsed: Date;
}
/**
 * Error event for real-time monitoring
 */
export interface ErrorEvent {
    id: string;
    timestamp: Date;
    type?: ErrorType;
    severity: ErrorSeverity | 'low' | 'medium' | 'high' | 'critical';
    message: string;
    source?: string;
    stack?: string;
    applicationId: string;
    context?: Record<string, unknown>;
    analyzed: boolean;
    patterns?: string[];
    analysis?: ErrorAnalysis;
    metadata?: Record<string, unknown>;
}
/**
 * Error metrics for monitoring
 */
export interface ErrorMetrics {
    totalErrors: number;
    errorRate: number;
    criticalErrors?: number;
    timeWindow?: string;
    errorsBySeverity: {
        low: number;
        medium: number;
        high: number;
        critical: number;
    };
    errorsByApplication: Record<string, number>;
    lastUpdated: Date;
    trends?: {
        increasing: boolean;
        percentageChange: number;
    };
}
/**
 * Monitoring alert configuration
 */
export interface MonitoringAlert {
    id: string;
    name?: string;
    title?: string;
    description: string;
    condition?: string;
    type?: string;
    severity: 'low' | 'medium' | 'high' | 'critical' | 'info' | 'warning' | 'error';
    enabled?: boolean;
    actions?: string[];
    timestamp: Date;
    applicationId: string;
    metadata?: Record<string, unknown>;
}
/**
 * System health status
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown' | 'warning' | 'critical';
/**
 * Monitored application configuration
 */
export interface MonitoredApplication {
    id: string;
    name: string;
    version?: string;
    environment?: string;
    language?: SupportedLanguage | string;
    endpoints?: string[];
    logSources?: string[];
    healthCheckUrl?: string;
    status: HealthStatus;
    lastSeen: Date;
}
/**
 * Error event subscriber
 */
export interface ErrorSubscriber {
    id?: string;
    name?: string;
    callback: (alert: MonitoringAlert) => void;
    filters?: {
        severity?: ErrorSeverity[];
        type?: ErrorType[];
        source?: string[];
    };
}
/**
 * Overall system health information
 */
export interface SystemHealth {
    status: HealthStatus;
    lastChecked?: Date;
    lastUpdated: Date;
    uptime?: number;
    errorRate: number;
    responseTime?: number;
    systemMetrics: PerformanceMetrics;
    activeAlerts: MonitoringAlert[];
    applicationHealth: Array<{
        applicationId: string;
        status: HealthStatus;
        lastSeen: Date;
    }>;
    issues: string[];
    components?: Record<string, HealthStatus>;
}
/**
 * Fix strategy for different error types
 */
export interface FixStrategy {
    errorType: ErrorType;
    priority: number;
    templates: FixTemplate[];
    automated: boolean;
}
/**
 * Extended stack trace frame with additional analysis data
 */
export interface StackTraceFrame extends StackFrame {
    /** Frame index in the stack trace */
    index?: number;
    /** Original text from stack trace */
    originalText?: string;
    /** Programming language */
    language?: LanguageSupport;
    /** Is this user code? */
    isUserCode?: boolean;
    /** Is this third-party library code? */
    isThirdParty?: boolean;
    /** Source location after source map resolution */
    sourceLocation?: SourceLocation | null;
    /** Context lines around the frame */
    context?: ContextLine[];
}
/**
 * Context line information
 */
export interface ContextLine {
    /** Line number */
    lineNumber: number;
    /** Line content */
    content: string;
    /** Is this the error line? */
    isErrorLine?: boolean;
    /** Line significance */
    significance?: 'high' | 'medium' | 'low';
}
/**
 * Source location after source map resolution
 */
export interface SourceLocation {
    /** Original source file */
    file: string;
    /** Original line number */
    line: number;
    /** Original column number */
    column: number;
    /** Original function/symbol name */
    name?: string;
    /** Original source code */
    source?: string;
}
/**
 * Frame analysis result
 */
export interface FrameAnalysis {
    /** The analyzed frame */
    frame: StackTraceFrame;
    /** Importance level */
    importance: FrameImportance;
    /** Frame category */
    category: 'user-code' | 'third-party' | 'system' | 'runtime';
    /** Analysis confidence */
    confidence: number;
    /** Generated insights */
    insights: string[];
    /** Related frames */
    relatedFrames: StackTraceFrame[];
}
/**
 * Frame importance levels
 */
export type FrameImportance = 'high' | 'medium' | 'low';
/**
 * Call chain analysis result
 */
export interface CallChainAnalysis {
    /** Total call stack depth */
    totalDepth: number;
    /** User code depth */
    userCodeDepth: number;
    /** Third-party code depth */
    thirdPartyDepth: number;
    /** System code depth */
    systemDepth: number;
    /** Entry point frame */
    entryPoint: StackTraceFrame | null;
    /** Error origin frame */
    errorOrigin: StackTraceFrame | null;
    /** Critical path frames */
    criticalPath: StackTraceFrame[];
    /** Async boundary frames */
    asyncBoundaries: StackTraceFrame[];
    /** Library transition points */
    libraryTransitions: Array<{
        from: StackTraceFrame;
        to: StackTraceFrame;
        transitionType: 'user-to-library' | 'library-to-user';
    }>;
}
/**
 * Stack trace pattern detection result
 */
export interface StackTracePattern {
    /** Pattern type */
    type: 'recursion' | 'asyncUnhandled' | 'memoryLeak' | 'typeError';
    /** Confidence score */
    confidence: number;
    /** Pattern description */
    description: string;
    /** Evidence text */
    evidence: string;
    /** Recommendations */
    recommendations: string[];
}
/**
 * Recursion detection result
 */
export interface RecursionDetection {
    /** Is recursion detected? */
    isRecursive: boolean;
    /** Recursive function name */
    recursiveFunction: string;
    /** Number of calls */
    callCount: number;
    /** Recursion pattern */
    pattern: string;
    /** Stack depth */
    depth: number;
    /** Recommendation */
    recommendation: string;
}
/**
 * Async call chain analysis
 */
export interface AsyncCallChain {
    /** Has async boundaries */
    hasAsyncBoundaries: boolean;
    /** Number of async frames */
    asyncFrameCount: number;
    /** Promise chain depth */
    promiseChainDepth: number;
    /** Has unhandled rejection */
    unhandledRejection: boolean;
    /** Has await pattern */
    awaitPattern: boolean;
    /** Recommendations */
    recommendations: string[];
}
/**
 * Task performance metrics for system monitoring
 */
export interface TaskPerformanceMetrics extends PerformanceMetrics {
    /** Total number of tasks */
    totalTasks: number;
    /** Number of completed tasks */
    completedTasks: number;
    /** Number of failed tasks */
    failedTasks: number;
    /** Average task duration in milliseconds */
    averageTaskDuration: number;
    /** System uptime */
    systemUptime: Date;
    /** System efficiency percentage */
    systemEfficiency: number;
}
