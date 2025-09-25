/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Budget Management API Documentation
 * Comprehensive documentation for all Budget API endpoints with examples,
 * schemas, and usage patterns. Provides both developer documentation
 * and OpenAPI/Swagger specifications.
 *
 * @author Claude Code - Budget Management API Endpoints Agent
 * @version 1.0.0
 */
import {
  BudgetSettings,
  BudgetUsageData,
  BudgetPermission,
} from '../../types.js';
/**
 * OpenAPI specification for the Budget Management API
 */
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Budget Management API',
    description:
      'Comprehensive REST API for budget tracking, analytics, and management',
    version: '1.0.0',
    contact: {
      name: 'Budget API Support',
      email: 'api-support@example.com',
    },
    license: {
      name: 'Apache 2.0',
      url: 'http://www.apache.org/licenses/LICENSE-2.0.html',
    },
  },
  servers: [
    {
      url: 'https://api.example.com/api/budget',
      description: 'Production server',
    },
    {
      url: 'https://staging-api.example.com/api/budget',
      description: 'Staging server',
    },
    {
      url: 'http://localhost:3000/api/budget',
      description: 'Development server',
    },
  ],
  security: [{ bearerAuth: [] }, { apiKeyAuth: [] }, { basicAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
      },
      basicAuth: {
        type: 'http',
        scheme: 'basic',
      },
    },
    schemas: {
      BudgetSettings: {
        type: 'object',
        properties: {
          enabled: {
            type: 'boolean',
            description: 'Whether budget tracking is enabled',
          },
          dailyLimit: {
            type: 'number',
            description: 'Daily spending limit in dollars',
            minimum: 0,
          },
          resetTime: {
            type: 'string',
            pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
            description: 'Time when budget resets (HH:MM format)',
          },
          warningThresholds: {
            type: 'array',
            items: {
              type: 'number',
              minimum: 0,
              maximum: 100,
            },
            description: 'Warning thresholds as percentages',
          },
        },
      },
      BudgetUsageData: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            format: 'date',
            description: 'Current date (YYYY-MM-DD format)',
          },
          requestCount: {
            type: 'integer',
            description: 'Total number of API requests',
          },
          totalCost: {
            type: 'number',
            description: 'Total cost in dollars',
          },
          lastResetTime: {
            type: 'string',
            format: 'date-time',
            description: 'Last reset timestamp',
          },
          warningsShown: {
            type: 'array',
            items: { type: 'number' },
            description: 'Warning thresholds that have been shown',
          },
        },
        required: [
          'date',
          'requestCount',
          'totalCost',
          'lastResetTime',
          'warningsShown',
        ],
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether the request was successful',
          },
          data: {
            type: 'object',
            description: 'Response data (varies by endpoint)',
          },
          error: {
            type: 'string',
            description: 'Error message (present if success=false)',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Response timestamp',
          },
        },
        required: ['success', 'timestamp'],
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            enum: [false],
          },
          error: {
            type: 'string',
            description: 'Error message',
          },
          details: {
            type: 'object',
            description: 'Additional error details',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
        },
        required: ['success', 'error', 'timestamp'],
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              error: 'Authentication required',
              timestamp: '2025-01-15T10:30:00.000Z',
            },
          },
        },
      },
      ForbiddenError: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              error: 'Insufficient permissions',
              details: {
                required: ['view_budget'],
                missing: ['view_budget'],
              },
              timestamp: '2025-01-15T10:30:00.000Z',
            },
          },
        },
      },
      RateLimitError: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              error: 'Rate limit exceeded',
              details: {
                limit: 100,
                window: '900 seconds',
                requests: 101,
                resetTime: '2025-01-15T10:45:00.000Z',
              },
              retryAfter: 600,
              timestamp: '2025-01-15T10:30:00.000Z',
            },
          },
        },
      },
      ValidationError: {
        description: 'Request validation failed',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              error: 'Request validation failed',
              details: {
                location: 'body',
                errors: ['dailyLimit must be a positive number'],
              },
              timestamp: '2025-01-15T10:30:00.000Z',
            },
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        description: 'Check the health status of the Budget API service',
        tags: ['Health'],
        security: [],
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' },
                example: {
                  success: true,
                  data: {
                    status: 'healthy',
                    timestamp: '2025-01-15T10:30:00.000Z',
                    responseTime: 5,
                    components: {
                      budgetTracker: {
                        status: 'healthy',
                        message: 'Budget tracker operational',
                      },
                      mlAPI: {
                        status: 'healthy',
                        details: {
                          trackerInitialized: true,
                          dataAvailable: true,
                          modelsTrained: true,
                        },
                      },
                    },
                    version: '1.0.0',
                  },
                  timestamp: '2025-01-15T10:30:00.000Z',
                },
              },
            },
          },
          503: {
            description: 'Service unavailable',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/usage': {
      get: {
        summary: 'Get current budget usage',
        description:
          'Retrieve current budget usage data with optional filtering',
        tags: ['Usage'],
        parameters: [
          {
            name: 'projectRoot',
            in: 'query',
            schema: { type: 'string' },
            description: 'Project root path for filtering',
          },
          {
            name: 'feature',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by specific feature',
          },
          {
            name: 'model',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by specific model',
          },
        ],
        responses: {
          200: {
            description: 'Current usage data retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            current: {
                              $ref: '#/components/schemas/BudgetUsageData',
                            },
                            mlPredictions: {
                              type: 'object',
                              description:
                                'ML-enhanced predictions and analytics',
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          401: { $ref: '#/components/responses/UnauthorizedError' },
          403: { $ref: '#/components/responses/ForbiddenError' },
          429: { $ref: '#/components/responses/RateLimitError' },
        },
      },
    },
    '/usage/history': {
      get: {
        summary: 'Get usage history',
        description:
          'Retrieve historical usage data with pagination and filters',
        tags: ['Usage'],
        parameters: [
          {
            name: 'startDate',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
            description: 'Start date for historical data',
          },
          {
            name: 'endDate',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
            description: 'End date for historical data',
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 1000, default: 50 },
            description: 'Maximum number of records to return',
          },
          {
            name: 'offset',
            in: 'query',
            schema: { type: 'integer', minimum: 0, default: 0 },
            description: 'Number of records to skip',
          },
          {
            name: 'granularity',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['hour', 'day', 'week', 'month'],
              default: 'day',
            },
            description: 'Data granularity level',
          },
        ],
        responses: {
          200: {
            description: 'Usage history retrieved successfully',
          },
          401: { $ref: '#/components/responses/UnauthorizedError' },
          403: { $ref: '#/components/responses/ForbiddenError' },
          429: { $ref: '#/components/responses/RateLimitError' },
        },
      },
    },
    '/config': {
      get: {
        summary: 'Get budget configuration',
        description: 'Retrieve current budget configuration settings',
        tags: ['Configuration'],
        responses: {
          200: {
            description: 'Configuration retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/ApiResponse' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            configuration: {
                              $ref: '#/components/schemas/BudgetSettings',
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          401: { $ref: '#/components/responses/UnauthorizedError' },
          403: { $ref: '#/components/responses/ForbiddenError' },
        },
      },
      post: {
        summary: 'Update budget configuration',
        description: 'Update budget configuration settings',
        tags: ['Configuration'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BudgetSettings' },
              example: {
                enabled: true,
                dailyLimit: 100.0,
                resetTime: '00:00',
                warningThresholds: [50, 75, 90],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Configuration updated successfully',
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/UnauthorizedError' },
          403: { $ref: '#/components/responses/ForbiddenError' },
        },
      },
    },
    '/analytics': {
      get: {
        summary: 'Get usage analytics',
        description: 'Retrieve comprehensive usage analytics and insights',
        tags: ['Analytics'],
        parameters: [
          {
            name: 'startDate',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
            description: 'Analytics start date',
          },
          {
            name: 'endDate',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
            description: 'Analytics end date',
          },
          {
            name: 'granularity',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['hour', 'day', 'week', 'month'],
              default: 'day',
            },
            description: 'Data granularity level',
          },
        ],
        responses: {
          200: {
            description: 'Analytics data retrieved successfully',
          },
          401: { $ref: '#/components/responses/UnauthorizedError' },
          403: { $ref: '#/components/responses/ForbiddenError' },
        },
      },
    },
    '/export': {
      get: {
        summary: 'Export budget data',
        description:
          'Export budget data in specified format (JSON, CSV, Excel, PDF)',
        tags: ['Export/Import'],
        parameters: [
          {
            name: 'format',
            in: 'query',
            required: true,
            schema: { type: 'string', enum: ['json', 'csv', 'xlsx', 'pdf'] },
            description: 'Export format',
          },
          {
            name: 'startDate',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
            description: 'Start date for export',
          },
          {
            name: 'endDate',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
            description: 'End date for export',
          },
          {
            name: 'includeHistory',
            in: 'query',
            schema: { type: 'boolean', default: false },
            description: 'Include historical data',
          },
          {
            name: 'includeAnalytics',
            in: 'query',
            schema: { type: 'boolean', default: false },
            description: 'Include analytics data',
          },
        ],
        responses: {
          200: {
            description: 'Data exported successfully',
            content: {
              'application/json': {
                description: 'JSON export',
              },
              'text/csv': {
                description: 'CSV export',
              },
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                {
                  description: 'Excel export',
                },
              'application/pdf': {
                description: 'PDF export',
              },
            },
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/UnauthorizedError' },
          403: { $ref: '#/components/responses/ForbiddenError' },
        },
      },
    },
    '/stream': {
      get: {
        summary: 'WebSocket stream endpoint',
        description:
          'Establish WebSocket connection for real-time budget updates',
        tags: ['Streaming'],
        responses: {
          101: {
            description: 'WebSocket connection established',
          },
          400: {
            description: 'WebSocket upgrade required',
          },
          401: { $ref: '#/components/responses/UnauthorizedError' },
        },
      },
    },
  },
  tags: [
    {
      name: 'Health',
      description: 'Health check and system status endpoints',
    },
    {
      name: 'Usage',
      description: 'Budget usage tracking and retrieval endpoints',
    },
    {
      name: 'Configuration',
      description: 'Budget configuration management endpoints',
    },
    {
      name: 'Analytics',
      description: 'Budget analytics and reporting endpoints',
    },
    {
      name: 'Export/Import',
      description: 'Data export and import endpoints',
    },
    {
      name: 'Streaming',
      description: 'Real-time data streaming endpoints',
    },
    {
      name: 'Alerts',
      description: 'Budget alerts and notifications endpoints',
    },
  ],
};
/**
 * API endpoint documentation with examples
 */
export const apiDocumentation = {
  title: 'Budget Management API Documentation',
  version: '1.0.0',
  description:
    'Complete documentation for the Budget Management API with examples and usage patterns.',
  authentication: {
    title: 'Authentication',
    description: 'The Budget API supports multiple authentication methods',
    methods: {
      bearer: {
        title: 'Bearer Token (JWT)',
        description: 'Use JWT tokens in the Authorization header',
        example:
          'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        usage: 'Preferred method for user authentication',
      },
      apiKey: {
        title: 'API Key',
        description: 'Use API keys in the X-API-Key header or query parameter',
        examples: [
          'X-API-Key: api_key_development_123',
          'GET /api/budget/usage?api_key=api_key_development_123',
        ],
        usage: 'Best for service-to-service communication',
      },
      basic: {
        title: 'Basic Authentication',
        description: 'Username and password encoded in base64',
        example: 'Authorization: Basic dGVzdHVzZXI6dGVzdHBhc3M=',
        usage: 'Simple authentication for development and testing',
      },
    },
  },
  endpoints: {
    usage: {
      title: 'Budget Usage Endpoints',
      description: 'Endpoints for tracking and retrieving budget usage data',
      endpoints: [
        {
          method: 'GET',
          path: '/api/budget/usage',
          description: 'Get current budget usage',
          permissions: ['view_budget', 'view_usage'],
          parameters: {
            query: {
              projectRoot: 'string - Optional project root filter',
              feature: 'string - Optional feature filter',
              model: 'string - Optional model filter',
            },
          },
          responses: {
            200: 'Current usage data with optional ML predictions',
            401: 'Authentication required',
            403: 'Insufficient permissions',
            429: 'Rate limit exceeded',
          },
          example: {
            request: 'GET /api/budget/usage?feature=text-generation',
            response: {
              success: true,
              data: {
                current: {
                  date: '2025-01-15',
                  requestCount: 1250,
                  totalCost: 42.75,
                  lastResetTime: '2025-01-15T00:00:00.000Z',
                  warningsShown: [50, 75],
                },
                mlPredictions: {
                  dailyForecast: [
                    {
                      timestamp: '2025-01-15T14:00:00.000Z',
                      predictedCost: 55.2,
                    },
                  ],
                  recommendations: [
                    {
                      type: 'cost_optimization',
                      description:
                        'Consider using smaller models for simple queries',
                      potentialSavings: 15.3,
                    },
                  ],
                },
              },
              timestamp: '2025-01-15T12:30:00.000Z',
            },
          },
        },
        {
          method: 'GET',
          path: '/api/budget/usage/history',
          description: 'Get historical usage data',
          permissions: ['view_budget', 'view_history'],
          parameters: {
            query: {
              startDate: 'ISO date string - Start of date range',
              endDate: 'ISO date string - End of date range',
              limit:
                'number (1-1000) - Maximum records to return (default: 50)',
              offset: 'number - Records to skip (default: 0)',
              granularity:
                'enum [hour,day,week,month] - Data granularity (default: day)',
            },
          },
          example: {
            request:
              'GET /api/budget/usage/history?startDate=2025-01-01T00:00:00Z&endDate=2025-01-15T23:59:59Z&granularity=day',
            response: {
              success: true,
              data: {
                history: [
                  {
                    date: '2025-01-15',
                    requestCount: 1250,
                    totalCost: 42.75,
                    lastResetTime: '2025-01-15T00:00:00.000Z',
                    warningsShown: [50, 75],
                  },
                  {
                    date: '2025-01-14',
                    requestCount: 980,
                    totalCost: 35.2,
                    lastResetTime: '2025-01-14T00:00:00.000Z',
                    warningsShown: [50],
                  },
                ],
                pagination: {
                  limit: 50,
                  offset: 0,
                  total: 15,
                },
              },
            },
          },
        },
      ],
    },
    configuration: {
      title: 'Budget Configuration Endpoints',
      description: 'Endpoints for managing budget settings and configuration',
      endpoints: [
        {
          method: 'GET',
          path: '/api/budget/config',
          description: 'Get current budget configuration',
          permissions: ['view_budget'],
          example: {
            response: {
              success: true,
              data: {
                configuration: {
                  enabled: true,
                  dailyLimit: 100.0,
                  resetTime: '00:00',
                  warningThresholds: [50, 75, 90],
                },
              },
            },
          },
        },
        {
          method: 'POST',
          path: '/api/budget/config',
          description: 'Update budget configuration',
          permissions: ['modify_settings'],
          requestBody: {
            enabled: 'boolean - Enable/disable budget tracking',
            dailyLimit: 'number - Daily spending limit in dollars',
            resetTime: 'string (HH:MM) - Time when budget resets',
            warningThresholds:
              'number[] - Warning thresholds as percentages (0-100)',
          },
          example: {
            request: {
              enabled: true,
              dailyLimit: 150.0,
              resetTime: '06:00',
              warningThresholds: [60, 80, 95],
            },
            response: {
              success: true,
              data: {
                configuration: {
                  enabled: true,
                  dailyLimit: 150.0,
                  resetTime: '06:00',
                  warningThresholds: [60, 80, 95],
                },
                changes: [
                  {
                    field: 'dailyLimit',
                    previousValue: 100.0,
                    newValue: 150.0,
                    type: 'modified',
                  },
                ],
              },
            },
          },
        },
      ],
    },
  },
  errorHandling: {
    title: 'Error Handling',
    description: 'Standard error response format and common error scenarios',
    format: {
      success: 'boolean - Always false for errors',
      error: 'string - Human-readable error message',
      details: 'object - Additional error details (optional)',
      timestamp: 'string - ISO timestamp when error occurred',
    },
    commonErrors: {
      400: {
        title: 'Bad Request',
        description: 'Invalid request data or parameters',
        example: {
          success: false,
          error: 'Request validation failed',
          details: {
            location: 'body',
            errors: ['dailyLimit must be a positive number'],
          },
          timestamp: '2025-01-15T10:30:00.000Z',
        },
      },
      401: {
        title: 'Unauthorized',
        description: 'Authentication required or invalid credentials',
        example: {
          success: false,
          error: 'Authentication required',
          timestamp: '2025-01-15T10:30:00.000Z',
        },
      },
      403: {
        title: 'Forbidden',
        description: 'Insufficient permissions for the requested operation',
        example: {
          success: false,
          error: 'Insufficient permissions',
          details: {
            required: ['modify_settings'],
            missing: ['modify_settings'],
          },
          timestamp: '2025-01-15T10:30:00.000Z',
        },
      },
      429: {
        title: 'Too Many Requests',
        description: 'Rate limit exceeded',
        example: {
          success: false,
          error: 'Rate limit exceeded',
          details: {
            limit: 100,
            window: '900 seconds',
            requests: 101,
            resetTime: '2025-01-15T10:45:00.000Z',
          },
          retryAfter: 600,
          timestamp: '2025-01-15T10:30:00.000Z',
        },
      },
    },
  },
  rateLimiting: {
    title: 'Rate Limiting',
    description: 'API rate limiting policies and headers',
    limits: {
      standard: '100 requests per 15 minutes',
      strict: '20 requests per 15 minutes (for sensitive endpoints)',
      burst: '10 requests per second',
    },
    headers: {
      'X-RateLimit-Limit': 'Maximum requests allowed in the time window',
      'X-RateLimit-Remaining': 'Remaining requests in the current window',
      'X-RateLimit-Reset': 'Unix timestamp when the rate limit resets',
      'X-RateLimit-Window': 'Time window duration in milliseconds',
      'Retry-After': 'Seconds to wait before retrying (only when rate limited)',
    },
  },
  websocketApi: {
    title: 'WebSocket Real-time API',
    description: 'Real-time budget updates via WebSocket connection',
    connectionUrl: 'ws://localhost:3000/api/budget/stream',
    authentication:
      'Include authentication in connection headers or query parameters',
    messageTypes: {
      usage_update: {
        description: 'Real-time usage updates',
        example: {
          type: 'usage_update',
          data: {
            date: '2025-01-15',
            requestCount: 1251,
            totalCost: 42.8,
            lastResetTime: '2025-01-15T00:00:00.000Z',
          },
          timestamp: '2025-01-15T12:30:15.000Z',
          source: 'budget-tracker',
        },
      },
      alert: {
        description: 'Budget alerts and warnings',
        example: {
          type: 'alert',
          data: {
            alertType: 'threshold_exceeded',
            threshold: 75,
            currentUsage: 76.5,
            message: '75% budget threshold exceeded',
          },
          timestamp: '2025-01-15T12:30:15.000Z',
          source: 'alert-system',
        },
      },
    },
    clientMessages: {
      subscribe: {
        description: 'Subscribe to specific event types',
        example: {
          type: 'subscribe',
          subscriptions: ['usage_updates', 'alerts'],
        },
      },
      ping: {
        description: 'Keep connection alive',
        example: {
          type: 'ping',
        },
      },
    },
  },
};
/**
 * Code examples for different programming languages
 */
export const codeExamples = {
  javascript: {
    title: 'JavaScript/Node.js Examples',
    examples: {
      getCurrentUsage: `
// Get current budget usage
const response = await fetch('/api/budget/usage', {
  headers: {
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
if (data.success) {
  console.log('Current usage:', data.data.current);
} else {
  console.error('Error:', data.error);
}
      `,
      updateConfiguration: `
// Update budget configuration
const config = {
  enabled: true,
  dailyLimit: 150.0,
  resetTime: '06:00',
  warningThresholds: [60, 80, 95]
};

const response = await fetch('/api/budget/config', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(config)
});

const result = await response.json();
      `,
      websocketConnection: `
// Connect to WebSocket for real-time updates
const ws = new WebSocket('ws://localhost:3000/api/budget/stream', [], {
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  }
});

ws.on('open', () => {
  console.log('WebSocket connected');

  // Subscribe to usage updates and alerts
  ws.send(JSON.stringify({
    type: 'subscribe',
    subscriptions: ['usage_updates', 'alerts']
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data);

  switch (message.type) {
    case 'usage_update':
      console.log('Usage updated:', message.data);
      break;
    case 'alert':
      console.log('Budget alert:', message.data);
      break;
  default:
      // Handle unexpected values
      break;


  });
      `,
    },
  },
  python: {
    title: 'Python Examples',
    examples: {
      getCurrentUsage: `
import requests

# Get current budget usage
response = requests.get(
    '/api/budget/usage',
    headers={
        'Authorization': 'Bearer your-jwt-token',
        'Content-Type': 'application/json'
    }
)

data = response.json()
if data['success']:
    print('Current usage:', data['data']['current'])
else:
    print('Error:', data['error'])
      `,
      updateConfiguration: `
import requests

# Update budget configuration
config = {
    'enabled': True,
    'dailyLimit': 150.0,
    'resetTime': '06:00',
    'warningThresholds': [60, 80, 95]
}

response = requests.post(
    '/api/budget/config',
    headers={
        'Authorization': 'Bearer your-jwt-token',
        'Content-Type': 'application/json'
    },
    json=config
)

result = response.json()
      `,
    },
  },
  curl: {
    title: 'cURL Examples',
    examples: {
      getCurrentUsage: `
# Get current budget usage
curl -X GET "https://api.example.com/api/budget/usage" \\
  -H "Authorization: Bearer your-jwt-token" \\
  -H "Content-Type: application/json"
      `,
      updateConfiguration: `
# Update budget configuration
curl -X POST "https://api.example.com/api/budget/config" \\
  -H "Authorization: Bearer your-jwt-token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "enabled": true,
    "dailyLimit": 150.0,
    "resetTime": "06:00",
    "warningThresholds": [60, 80, 95]
  }'
      `,
      exportData: `
# Export budget data as CSV
curl -X GET "https://api.example.com/api/budget/export?format=csv&includeHistory=true" \\
  -H "Authorization: Bearer your-jwt-token" \\
  -o "budget-export.csv"
      `,
    },
  },
};
/**
 * Export complete documentation object
 */
export const completeBudgetAPIDocumentation = {
  openApiSpec,
  apiDocumentation,
  codeExamples,
  version: '1.0.0',
  lastUpdated: '2025-01-15T10:30:00.000Z',
};
//# sourceMappingURL=api-documentation.js.map
