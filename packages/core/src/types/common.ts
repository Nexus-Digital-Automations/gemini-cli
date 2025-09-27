/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Common type definitions and exports
 * Provides shared types and interfaces used across the core modules
 *
 * @author Historical Data Storage and Analysis Agent
 * @version 1.0.0
 */

// Re-export logger types from utils
export type {
  StructuredLogger as Logger,
  LoggerConfig,
  LogMeta,
} from '../utils/logger.js';

// Common utility types
export type Timestamp = number;
export type SessionId = string;
export type ComponentName = string;

// Base configuration interface
export interface BaseConfig {
  enabled?: boolean;
  metadata?: Record<string, unknown>;
}

// Error handling types
export interface ErrorContext {
  component: string;
  operation: string;
  timestamp: Timestamp;
  metadata?: Record<string, unknown>;
}

// Generic result wrapper
export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

// Async operation status
export enum OperationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// Performance metrics
export interface PerformanceMetrics {
  startTime: Timestamp;
  endTime?: Timestamp;
  duration?: number;
  memoryUsage?: number;
  operationCount?: number;
}
