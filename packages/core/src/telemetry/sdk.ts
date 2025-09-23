/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { DiagConsoleLogger, DiagLogLevel, diag } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { OTLPTraceExporter as OTLPTraceExporterHttp } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPLogExporter as OTLPLogExporterHttp } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPMetricExporter as OTLPMetricExporterHttp } from '@opentelemetry/exporter-metrics-otlp-http';
import { CompressionAlgorithm } from '@opentelemetry/otlp-exporter-base';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
} from '@opentelemetry/sdk-trace-node';
import {
  BatchLogRecordProcessor,
  ConsoleLogRecordExporter,
} from '@opentelemetry/sdk-logs';
import {
  ConsoleMetricExporter,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import type { Config } from '../config/config.js';
import { SERVICE_NAME } from './constants.js';
import { initializeMetrics } from './metrics.js';
import { ClearcutLogger } from './clearcut-logger/clearcut-logger.js';
import { getComponentLogger } from '../utils/logger.js';
import {
  FileLogExporter,
  FileMetricExporter,
  FileSpanExporter,
} from './file-exporters.js';
import {
  GcpTraceExporter,
  GcpMetricExporter,
  GcpLogExporter,
} from './gcp-exporters.js';
import { TelemetryTarget } from './index.js';

// For troubleshooting, set the log level to DiagLogLevel.DEBUG
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

let sdk: NodeSDK | undefined;
let telemetryInitialized = false;

/**
 * Check if the OpenTelemetry SDK has been initialized.
 *
 * @returns True if telemetry SDK is initialized and ready for use
 */
export function isTelemetrySdkInitialized(): boolean {
  return telemetryInitialized;
}

/**
 * Parse and validate OTLP endpoint configuration.
 *
 * Processes OTLP endpoint URLs for different protocols, handling format differences
 * between gRPC (requires origin only) and HTTP (requires full URL).
 *
 * @param otlpEndpointSetting - Raw endpoint setting from configuration
 * @param protocol - Protocol type (grpc or http)
 * @returns Parsed endpoint URL or undefined if invalid
 * @private
 */
function parseOtlpEndpoint(
  otlpEndpointSetting: string | undefined,
  protocol: 'grpc' | 'http',
): string | undefined {
  if (!otlpEndpointSetting) {
    return undefined;
  }
  // Trim leading/trailing quotes that might come from env variables
  const trimmedEndpoint = otlpEndpointSetting.replace(/^["']|["']$/g, '');

  try {
    const url = new URL(trimmedEndpoint);
    if (protocol === 'grpc') {
      // OTLP gRPC exporters expect an endpoint in the format scheme://host:port
      // The `origin` property provides this, stripping any path, query, or hash.
      return url.origin;
    }
    // For http, use the full href.
    return url.href;
  } catch (error) {
    diag.error('Invalid OTLP endpoint URL provided:', trimmedEndpoint, error);
    return undefined;
  }
}

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
export function initializeTelemetry(config: Config): void {
  if (telemetryInitialized || !config.getTelemetryEnabled()) {
    return;
  }

  const resource = resourceFromAttributes({
    [SemanticResourceAttributes.SERVICE_NAME]: SERVICE_NAME,
    [SemanticResourceAttributes.SERVICE_VERSION]: process.version,
    'session.id': config.getSessionId(),
  });

  const otlpEndpoint = config.getTelemetryOtlpEndpoint();
  const otlpProtocol = config.getTelemetryOtlpProtocol();
  const telemetryTarget = config.getTelemetryTarget();
  const useCollector = config.getTelemetryUseCollector();
  const parsedEndpoint = parseOtlpEndpoint(otlpEndpoint, otlpProtocol);
  const telemetryOutfile = config.getTelemetryOutfile();
  const useOtlp = !!parsedEndpoint && !telemetryOutfile;

  const gcpProjectId =
    process.env['OTLP_GOOGLE_CLOUD_PROJECT'] ||
    process.env['GOOGLE_CLOUD_PROJECT'];
  const useDirectGcpExport =
    telemetryTarget === TelemetryTarget.GCP && !!gcpProjectId && !useCollector;

  let spanExporter:
    | OTLPTraceExporter
    | OTLPTraceExporterHttp
    | GcpTraceExporter
    | FileSpanExporter
    | ConsoleSpanExporter;
  let logExporter:
    | OTLPLogExporter
    | OTLPLogExporterHttp
    | GcpLogExporter
    | FileLogExporter
    | ConsoleLogRecordExporter;
  let metricReader: PeriodicExportingMetricReader;

  if (useDirectGcpExport) {
    spanExporter = new GcpTraceExporter(gcpProjectId);
    logExporter = new GcpLogExporter(gcpProjectId);
    metricReader = new PeriodicExportingMetricReader({
      exporter: new GcpMetricExporter(gcpProjectId),
      exportIntervalMillis: 30000,
    });
  } else if (useOtlp) {
    if (otlpProtocol === 'http') {
      spanExporter = new OTLPTraceExporterHttp({
        url: parsedEndpoint,
      });
      logExporter = new OTLPLogExporterHttp({
        url: parsedEndpoint,
      });
      metricReader = new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporterHttp({
          url: parsedEndpoint,
        }),
        exportIntervalMillis: 10000,
      });
    } else {
      // grpc
      spanExporter = new OTLPTraceExporter({
        url: parsedEndpoint,
        compression: CompressionAlgorithm.GZIP,
      });
      logExporter = new OTLPLogExporter({
        url: parsedEndpoint,
        compression: CompressionAlgorithm.GZIP,
      });
      metricReader = new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({
          url: parsedEndpoint,
          compression: CompressionAlgorithm.GZIP,
        }),
        exportIntervalMillis: 10000,
      });
    }
  } else if (telemetryOutfile) {
    spanExporter = new FileSpanExporter(telemetryOutfile);
    logExporter = new FileLogExporter(telemetryOutfile);
    metricReader = new PeriodicExportingMetricReader({
      exporter: new FileMetricExporter(telemetryOutfile),
      exportIntervalMillis: 10000,
    });
  } else {
    spanExporter = new ConsoleSpanExporter();
    logExporter = new ConsoleLogRecordExporter();
    metricReader = new PeriodicExportingMetricReader({
      exporter: new ConsoleMetricExporter(),
      exportIntervalMillis: 10000,
    });
  }

  sdk = new NodeSDK({
    resource,
    spanProcessors: [new BatchSpanProcessor(spanExporter)],
    logRecordProcessors: [new BatchLogRecordProcessor(logExporter)],
    metricReader,
    instrumentations: [new HttpInstrumentation()],
  });

  try {
    sdk.start();
    if (config.getDebugMode()) {
      const logger = getComponentLogger('TelemetrySDK');
      logger.info('OpenTelemetry SDK started successfully.');
    }
    telemetryInitialized = true;
    initializeMetrics(config);
  } catch (error) {
    const logger = createLogger('TelemetrySDK');
    logger.error('Error starting OpenTelemetry SDK', error as Error);
  }

  process.on('SIGTERM', () => {
    shutdownTelemetry(config);
  });
  process.on('SIGINT', () => {
    shutdownTelemetry(config);
  });
  process.on('exit', () => {
    shutdownTelemetry(config);
  });
}

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
export async function shutdownTelemetry(config: Config): Promise<void> {
  if (!telemetryInitialized || !sdk) {
    return;
  }
  try {
    ClearcutLogger.getInstance()?.shutdown();
    await sdk.shutdown();
    if (config.getDebugMode()) {
      const logger = getComponentLogger('TelemetrySDK');
      logger.info('OpenTelemetry SDK shut down successfully.');
    }
  } catch (error) {
    const logger = createLogger('TelemetrySDK');
    logger.error('Error shutting down SDK', error as Error);
  } finally {
    telemetryInitialized = false;
  }
}
