/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
/**
 * Check if the OpenTelemetry SDK has been initialized.
 *
 * @returns True if telemetry SDK is initialized and ready for use
 */
export declare function isTelemetrySdkInitialized(): boolean;
/**
 * Initialize the OpenTelemetry SDK with the provided configuration.
 *
 * Sets up comprehensive telemetry infrastructure including:
 * - Span, log, and metric exporters based on target configuration
 * - Resource attribution with service name and session ID
 * - Automatic instrumentation for HTTP requests
 * - Graceful shutdown handlers for process termination
 *
 * Supports multiple export targets:
 * - **OTLP**: Direct export to OpenTelemetry collectors via gRPC or HTTP
 * - **GCP**: Direct export to Google Cloud Platform telemetry services
 * - **File**: Export to local files for debugging and development
 * - **Console**: Export to console for development and testing
 *
 * The function is idempotent - calling it multiple times has no effect
 * after the first successful initialization.
 *
 * @param config - Application configuration containing telemetry settings
 *
 * @example
 * ```typescript
 * initializeTelemetry(config);
 * // OpenTelemetry SDK is now active and instrumenting the application
 * ```
 */
export declare function initializeTelemetry(config: Config): void;
/**
 * Gracefully shutdown the OpenTelemetry SDK and flush pending telemetry data.
 *
 * Performs clean shutdown of all telemetry components:
 * - Flushes pending spans, logs, and metrics
 * - Shuts down Clearcut logger instance
 * - Terminates SDK and all associated resources
 * - Resets initialization state
 *
 * This function should be called during application shutdown to ensure
 * all telemetry data is properly exported before termination.
 *
 * @param config - Application configuration for debug logging
 * @returns Promise that resolves when shutdown is complete
 *
 * @example
 * ```typescript
 * process.on('SIGINT', async () => {
 *   await shutdownTelemetry(config);
 *   process.exit(0);
 * });
 * ```
 */
export declare function shutdownTelemetry(config: Config): Promise<void>;
