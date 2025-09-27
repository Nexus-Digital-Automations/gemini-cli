/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shared type definitions for all test files
 * These types replace explicit 'any' types across the test suite
 */

// Generic test event and data structures
export interface TestEventBase {
  type: string;
  timestamp?: number;
  [key: string]: unknown;
}

export interface MetricEvent extends TestEventBase {
  type: 'metric' | 'performance' | 'system';
  metric: string;
  value: number | Record<string, unknown>;
  tags?: Record<string, string>;
}

export interface AlertEvent extends TestEventBase {
  type: 'triggered' | 'resolved' | 'escalated' | 'alert' | 'cross_system';
  alertId?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  message?: string;
  conditions?: Record<string, unknown>;
}

// Dependency and task-related structures
export interface DependencyChange {
  type:
    | 'remove_dependency'
    | 'add_task'
    | 'merge_tasks'
    | 'update_task'
    | 'resolve_conflict';
  taskId?: string;
  dependencyId?: string;
  sourceTaskId?: string;
  targetTaskId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface TaskCycle {
  id: string;
  tasks: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolutionStrategy?: string;
  metadata?: Record<string, unknown>;
}

export interface CircularDependencyResult {
  originalCycles: TaskCycle[];
  resolvedCycles?: TaskCycle[];
  remainingCycles: TaskCycle[];
  changes: DependencyChange[];
  success: boolean;
}

// Validation and quality assessment
export interface MockValidationFramework {
  validateTask: jest.MockedFunction<(task: unknown) => ValidationResult>;
  validateDependencies: jest.MockedFunction<
    (deps: unknown[]) => ValidationResult
  >;
  getValidationRules: jest.MockedFunction<() => ValidationRule[]>;
  setValidationLevel: jest.MockedFunction<(level: string) => void>;
  on: jest.MockedFunction<
    (event: string, handler: (data: unknown) => void) => void
  >;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score?: number;
}

export interface ValidationError {
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  context?: Record<string, unknown>;
}

export interface ValidationWarning {
  code: string;
  message: string;
  suggestion?: string;
  context?: Record<string, unknown>;
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
}

// Context and compression-related types
export interface CompressionEvent extends TestEventBase {
  type:
    | 'compression'
    | 'decompression'
    | 'cache_hit'
    | 'cache_miss'
    | 'emergency';
  compressionRatio?: number;
  originalSize?: number;
  compressedSize?: number;
  algorithm?: string;
  success: boolean;
}

export interface TokenLimitEvent extends TestEventBase {
  type:
    | 'token_limit_warning'
    | 'token_limit_exceeded'
    | 'compression_triggered';
  tokenCount: number;
  limit: number;
  action?: string;
}

export interface ProcessedData {
  processedItems: ProcessedItem[];
  summary: ProcessingSummary;
  metadata: Record<string, unknown>;
}

export interface ProcessedItem {
  id: string;
  originalSize: number;
  processedSize: number;
  compressionRatio: number;
  success: boolean;
  errors?: string[];
}

export interface ProcessingSummary {
  totalItems: number;
  successCount: number;
  failureCount: number;
  totalOriginalSize: number;
  totalProcessedSize: number;
  overallCompressionRatio: number;
}

export interface ProcessedResult {
  items: ProcessedItem[];
  summary: ProcessingSummary;
  performance: PerformanceMetrics;
}

export interface PerformanceMetrics {
  duration: number;
  memoryUsage: number;
  cpuUsage: number;
  throughput: number;
}

// Tool-related mock types
export interface MockGeminiClient {
  generateContent: jest.MockedFunction<
    (request: unknown) => Promise<GenerationResponse>
  >;
  countTokens: jest.MockedFunction<
    (request: unknown) => Promise<TokenCountResponse>
  >;
  embedContent: jest.MockedFunction<
    (request: unknown) => Promise<EmbedResponse>
  >;
}

export interface MockIdeClient {
  readFile: jest.MockedFunction<(path: string) => Promise<string>>;
  writeFile: jest.MockedFunction<
    (path: string, content: string) => Promise<void>
  >;
  listFiles: jest.MockedFunction<(directory: string) => Promise<string[]>>;
  executeCommand: jest.MockedFunction<
    (command: string) => Promise<CommandResult>
  >;
}

export interface GenerationResponse {
  candidates: GenerationCandidate[];
  usageMetadata?: UsageMetadata;
}

export interface GenerationCandidate {
  content: Content;
  finishReason: string;
  safetyRatings: SafetyRating[];
}

export interface Content {
  parts: Part[];
  role?: string;
}

export interface Part {
  text?: string;
  functionCall?: FunctionCall;
  functionResponse?: FunctionResponse;
}

export interface FunctionCall {
  name: string;
  args: Record<string, unknown>;
}

export interface FunctionResponse {
  name: string;
  response: Record<string, unknown>;
}

export interface SafetyRating {
  category: string;
  probability: string;
  blocked?: boolean;
}

export interface UsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

export interface TokenCountResponse {
  totalTokens: number;
}

export interface EmbedResponse {
  embedding: {
    values: number[];
  };
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

// Budget monitoring types
export interface BudgetEvent extends TestEventBase {
  type:
    | 'budget_warning'
    | 'budget_exceeded'
    | 'usage_recorded'
    | 'cost_calculated';
  amount?: number;
  currency?: string;
  budgetType?: string;
  remaining?: number;
  utilized?: number;
}

export interface MockBudgetRequest {
  model: string;
  tokens: number;
  operation: string;
  metadata?: Record<string, unknown>;
}

export interface MockBudgetResponse {
  cost: number;
  currency: string;
  budgetRemaining: number;
  warnings: string[];
}

// Service and communication types
export interface AgentCommunicationEvent extends TestEventBase {
  type:
    | 'message_sent'
    | 'message_received'
    | 'agent_connected'
    | 'agent_disconnected';
  agentId: string;
  message?: string;
  channel?: string;
}

export interface MockAgentCommunicationHub {
  sendMessage: jest.MockedFunction<
    (agentId: string, message: unknown) => Promise<void>
  >;
  broadcastMessage: jest.MockedFunction<(message: unknown) => Promise<void>>;
  connectAgent: jest.MockedFunction<(agentId: string) => Promise<boolean>>;
  disconnectAgent: jest.MockedFunction<(agentId: string) => Promise<boolean>>;
  on: jest.MockedFunction<
    (event: string, handler: (data: unknown) => void) => void
  >;
}

// Utility types for common test scenarios
export interface MockEventEmitter {
  on: jest.MockedFunction<
    (event: string, listener: (...args: unknown[]) => void) => void
  >;
  emit: jest.MockedFunction<(event: string, ...args: unknown[]) => boolean>;
  removeListener: jest.MockedFunction<
    (event: string, listener: (...args: unknown[]) => void) => void
  >;
  removeAllListeners: jest.MockedFunction<(event?: string) => void>;
  setMaxListeners: jest.MockedFunction<(n: number) => void>;
}

export interface TestCondition {
  condition: (data: Record<string, unknown>) => boolean;
  description?: string;
  timeout?: number;
}

export interface TestAlert {
  id: string;
  condition: TestCondition;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  enabled: boolean;
}

// Generic utility types
export type TestCallback<T = unknown> = (data: T) => void;
export type AsyncTestCallback<T = unknown> = (data: T) => Promise<void>;

export interface TestConfiguration extends Record<string, unknown> {
  timeout?: number;
  retries?: number;
  parallel?: boolean;
  mockMode?: boolean;
}

export interface TestMetadata extends Record<string, unknown> {
  testName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  result?: 'pass' | 'fail' | 'skip';
}

// Error handling types
export interface TestError extends Error {
  code?: string;
  context?: Record<string, unknown>;
  timestamp?: number;
  retryable?: boolean;
}

export interface TestWarning {
  message: string;
  code?: string;
  context?: Record<string, unknown>;
  suggestion?: string;
}

// For JSON stringify utility tests
export interface JsonStringifyTestCase {
  input: unknown;
  expected: string | null;
  description: string;
  shouldThrow?: boolean;
  replacer?: (key: string, value: unknown) => unknown;
  space?: string | number;
}
