/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Meter } from '@opentelemetry/api';
import type { Config } from '../config/config.js';
import type { ModelRoutingEvent, ModelSlashCommandEvent } from './types.js';
export declare enum FileOperation {
    CREATE = "create",
    READ = "read",
    UPDATE = "update"
}
export declare enum PerformanceMetricType {
    STARTUP = "startup",
    MEMORY = "memory",
    CPU = "cpu",
    TOOL_EXECUTION = "tool_execution",
    API_REQUEST = "api_request",
    TOKEN_EFFICIENCY = "token_efficiency"
}
export declare enum MemoryMetricType {
    HEAP_USED = "heap_used",
    HEAP_TOTAL = "heap_total",
    EXTERNAL = "external",
    RSS = "rss"
}
export declare enum ToolExecutionPhase {
    VALIDATION = "validation",
    PREPARATION = "preparation",
    EXECUTION = "execution",
    RESULT_PROCESSING = "result_processing"
}
export declare enum ApiRequestPhase {
    REQUEST_PREPARATION = "request_preparation",
    NETWORK_LATENCY = "network_latency",
    RESPONSE_PROCESSING = "response_processing",
    TOKEN_PROCESSING = "token_processing"
}
export declare function getMeter(): Meter | undefined;
export declare function initializeMetrics(config: Config): void;
export declare function recordChatCompressionMetrics(config: Config, args: {
    tokens_before: number;
    tokens_after: number;
}): void;
export declare function recordToolCallMetrics(config: Config, functionName: string, durationMs: number, success: boolean, decision?: 'accept' | 'reject' | 'modify' | 'auto_accept', tool_type?: 'native' | 'mcp'): void;
export declare function recordTokenUsageMetrics(config: Config, model: string, tokenCount: number, type: 'input' | 'output' | 'thought' | 'cache' | 'tool'): void;
export declare function recordApiResponseMetrics(config: Config, model: string, durationMs: number, statusCode?: number | string): void;
export declare function recordApiErrorMetrics(config: Config, model: string, durationMs: number, statusCode?: number | string, errorType?: string): void;
export declare function recordFileOperationMetric(config: Config, operation: FileOperation, lines?: number, mimetype?: string, extension?: string, programming_language?: string): void;
/**
 * Records a metric for when an invalid chunk is received from a stream.
 */
export declare function recordInvalidChunk(config: Config): void;
/**
 * Records a metric for when a retry is triggered due to a content error.
 */
export declare function recordContentRetry(config: Config): void;
/**
 * Records a metric for when all content error retries have failed for a request.
 */
export declare function recordContentRetryFailure(config: Config): void;
export declare function recordModelSlashCommand(config: Config, event: ModelSlashCommandEvent): void;
export declare function recordModelRoutingMetrics(config: Config, event: ModelRoutingEvent): void;
export declare function initializePerformanceMonitoring(config: Config): void;
export declare function recordStartupPerformance(config: Config, phase: string, durationMs: number, details?: Record<string, string | number | boolean>): void;
export declare function recordMemoryUsage(config: Config, memoryType: MemoryMetricType, bytes: number, component?: string): void;
export declare function recordCpuUsage(config: Config, percentage: number, component?: string): void;
export declare function recordToolQueueDepth(config: Config, queueDepth: number): void;
export declare function recordToolExecutionBreakdown(config: Config, functionName: string, phase: ToolExecutionPhase, durationMs: number): void;
export declare function recordTokenEfficiency(config: Config, model: string, metric: string, value: number, context?: string): void;
export declare function recordApiRequestBreakdown(config: Config, model: string, phase: ApiRequestPhase, durationMs: number): void;
export declare function recordPerformanceScore(config: Config, score: number, category: string, baseline?: number): void;
export declare function recordPerformanceRegression(config: Config, metric: string, currentValue: number, baselineValue: number, severity: 'low' | 'medium' | 'high'): void;
export declare function recordBaselineComparison(config: Config, metric: string, currentValue: number, baselineValue: number, category: string): void;
export declare function isPerformanceMonitoringActive(): boolean;
