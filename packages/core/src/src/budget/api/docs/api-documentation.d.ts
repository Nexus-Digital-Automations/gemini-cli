/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * OpenAPI specification for the Budget Management API
 */
export declare const openApiSpec: {
    openapi: string;
    info: {
        title: string;
        description: string;
        version: string;
        contact: {
            name: string;
            email: string;
        };
        license: {
            name: string;
            url: string;
        };
    };
    servers: {
        url: string;
        description: string;
    }[];
    security: ({
        bearerAuth: any[];
        apiKeyAuth?: undefined;
        basicAuth?: undefined;
    } | {
        apiKeyAuth: any[];
        bearerAuth?: undefined;
        basicAuth?: undefined;
    } | {
        basicAuth: any[];
        bearerAuth?: undefined;
        apiKeyAuth?: undefined;
    })[];
    components: {
        securitySchemes: {
            bearerAuth: {
                type: string;
                scheme: string;
                bearerFormat: string;
            };
            apiKeyAuth: {
                type: string;
                in: string;
                name: string;
            };
            basicAuth: {
                type: string;
                scheme: string;
            };
        };
        schemas: {
            BudgetSettings: {
                type: string;
                properties: {
                    enabled: {
                        type: string;
                        description: string;
                    };
                    dailyLimit: {
                        type: string;
                        description: string;
                        minimum: number;
                    };
                    resetTime: {
                        type: string;
                        pattern: string;
                        description: string;
                    };
                    warningThresholds: {
                        type: string;
                        items: {
                            type: string;
                            minimum: number;
                            maximum: number;
                        };
                        description: string;
                    };
                };
            };
            BudgetUsageData: {
                type: string;
                properties: {
                    date: {
                        type: string;
                        format: string;
                        description: string;
                    };
                    requestCount: {
                        type: string;
                        description: string;
                    };
                    totalCost: {
                        type: string;
                        description: string;
                    };
                    lastResetTime: {
                        type: string;
                        format: string;
                        description: string;
                    };
                    warningsShown: {
                        type: string;
                        items: {
                            type: string;
                        };
                        description: string;
                    };
                };
                required: string[];
            };
            ApiResponse: {
                type: string;
                properties: {
                    success: {
                        type: string;
                        description: string;
                    };
                    data: {
                        type: string;
                        description: string;
                    };
                    error: {
                        type: string;
                        description: string;
                    };
                    timestamp: {
                        type: string;
                        format: string;
                        description: string;
                    };
                };
                required: string[];
            };
            ErrorResponse: {
                type: string;
                properties: {
                    success: {
                        type: string;
                        enum: boolean[];
                    };
                    error: {
                        type: string;
                        description: string;
                    };
                    details: {
                        type: string;
                        description: string;
                    };
                    timestamp: {
                        type: string;
                        format: string;
                    };
                };
                required: string[];
            };
        };
        responses: {
            UnauthorizedError: {
                description: string;
                content: {
                    'application/json': {
                        schema: {
                            $ref: string;
                        };
                        example: {
                            success: boolean;
                            error: string;
                            timestamp: string;
                        };
                    };
                };
            };
            ForbiddenError: {
                description: string;
                content: {
                    'application/json': {
                        schema: {
                            $ref: string;
                        };
                        example: {
                            success: boolean;
                            error: string;
                            details: {
                                required: string[];
                                missing: string[];
                            };
                            timestamp: string;
                        };
                    };
                };
            };
            RateLimitError: {
                description: string;
                content: {
                    'application/json': {
                        schema: {
                            $ref: string;
                        };
                        example: {
                            success: boolean;
                            error: string;
                            details: {
                                limit: number;
                                window: string;
                                requests: number;
                                resetTime: string;
                            };
                            retryAfter: number;
                            timestamp: string;
                        };
                    };
                };
            };
            ValidationError: {
                description: string;
                content: {
                    'application/json': {
                        schema: {
                            $ref: string;
                        };
                        example: {
                            success: boolean;
                            error: string;
                            details: {
                                location: string;
                                errors: string[];
                            };
                            timestamp: string;
                        };
                    };
                };
            };
        };
    };
    paths: {
        '/health': {
            get: {
                summary: string;
                description: string;
                tags: string[];
                security: any[];
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                                example: {
                                    success: boolean;
                                    data: {
                                        status: string;
                                        timestamp: string;
                                        responseTime: number;
                                        components: {
                                            budgetTracker: {
                                                status: string;
                                                message: string;
                                            };
                                            mlAPI: {
                                                status: string;
                                                details: {
                                                    trackerInitialized: boolean;
                                                    dataAvailable: boolean;
                                                    modelsTrained: boolean;
                                                };
                                            };
                                        };
                                        version: string;
                                    };
                                    timestamp: string;
                                };
                            };
                        };
                    };
                    '503': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        '/usage': {
            get: {
                summary: string;
                description: string;
                tags: string[];
                parameters: {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                    };
                    description: string;
                }[];
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: ({
                                        $ref: string;
                                        properties?: undefined;
                                    } | {
                                        properties: {
                                            data: {
                                                type: string;
                                                properties: {
                                                    current: {
                                                        $ref: string;
                                                    };
                                                    mlPredictions: {
                                                        type: string;
                                                        description: string;
                                                    };
                                                };
                                            };
                                        };
                                        $ref?: undefined;
                                    })[];
                                };
                            };
                        };
                    };
                    '401': {
                        $ref: string;
                    };
                    '403': {
                        $ref: string;
                    };
                    '429': {
                        $ref: string;
                    };
                };
            };
        };
        '/usage/history': {
            get: {
                summary: string;
                description: string;
                tags: string[];
                parameters: ({
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        format: string;
                        minimum?: undefined;
                        maximum?: undefined;
                        default?: undefined;
                        enum?: undefined;
                    };
                    description: string;
                } | {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        minimum: number;
                        maximum: number;
                        default: number;
                        format?: undefined;
                        enum?: undefined;
                    };
                    description: string;
                } | {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        minimum: number;
                        default: number;
                        format?: undefined;
                        maximum?: undefined;
                        enum?: undefined;
                    };
                    description: string;
                } | {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        enum: string[];
                        default: string;
                        format?: undefined;
                        minimum?: undefined;
                        maximum?: undefined;
                    };
                    description: string;
                })[];
                responses: {
                    '200': {
                        description: string;
                    };
                    '401': {
                        $ref: string;
                    };
                    '403': {
                        $ref: string;
                    };
                    '429': {
                        $ref: string;
                    };
                };
            };
        };
        '/config': {
            get: {
                summary: string;
                description: string;
                tags: string[];
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: ({
                                        $ref: string;
                                        properties?: undefined;
                                    } | {
                                        properties: {
                                            data: {
                                                type: string;
                                                properties: {
                                                    configuration: {
                                                        $ref: string;
                                                    };
                                                };
                                            };
                                        };
                                        $ref?: undefined;
                                    })[];
                                };
                            };
                        };
                    };
                    '401': {
                        $ref: string;
                    };
                    '403': {
                        $ref: string;
                    };
                };
            };
            post: {
                summary: string;
                description: string;
                tags: string[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                            example: {
                                enabled: boolean;
                                dailyLimit: number;
                                resetTime: string;
                                warningThresholds: number[];
                            };
                        };
                    };
                };
                responses: {
                    '200': {
                        description: string;
                    };
                    '400': {
                        $ref: string;
                    };
                    '401': {
                        $ref: string;
                    };
                    '403': {
                        $ref: string;
                    };
                };
            };
        };
        '/analytics': {
            get: {
                summary: string;
                description: string;
                tags: string[];
                parameters: ({
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        format: string;
                        enum?: undefined;
                        default?: undefined;
                    };
                    description: string;
                } | {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        enum: string[];
                        default: string;
                        format?: undefined;
                    };
                    description: string;
                })[];
                responses: {
                    '200': {
                        description: string;
                    };
                    '401': {
                        $ref: string;
                    };
                    '403': {
                        $ref: string;
                    };
                };
            };
        };
        '/export': {
            get: {
                summary: string;
                description: string;
                tags: string[];
                parameters: ({
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        enum: string[];
                        format?: undefined;
                        default?: undefined;
                    };
                    description: string;
                } | {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        format: string;
                        enum?: undefined;
                        default?: undefined;
                    };
                    description: string;
                    required?: undefined;
                } | {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                        default: boolean;
                        enum?: undefined;
                        format?: undefined;
                    };
                    description: string;
                    required?: undefined;
                })[];
                responses: {
                    '200': {
                        description: string;
                        content: {
                            'application/json': {
                                description: string;
                            };
                            'text/csv': {
                                description: string;
                            };
                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                                description: string;
                            };
                            'application/pdf': {
                                description: string;
                            };
                        };
                    };
                    '400': {
                        $ref: string;
                    };
                    '401': {
                        $ref: string;
                    };
                    '403': {
                        $ref: string;
                    };
                };
            };
        };
        '/stream': {
            get: {
                summary: string;
                description: string;
                tags: string[];
                responses: {
                    '101': {
                        description: string;
                    };
                    '400': {
                        description: string;
                    };
                    '401': {
                        $ref: string;
                    };
                };
            };
        };
    };
    tags: {
        name: string;
        description: string;
    }[];
};
/**
 * API endpoint documentation with examples
 */
export declare const apiDocumentation: {
    title: string;
    version: string;
    description: string;
    authentication: {
        title: string;
        description: string;
        methods: {
            bearer: {
                title: string;
                description: string;
                example: string;
                usage: string;
            };
            apiKey: {
                title: string;
                description: string;
                examples: string[];
                usage: string;
            };
            basic: {
                title: string;
                description: string;
                example: string;
                usage: string;
            };
        };
    };
    endpoints: {
        usage: {
            title: string;
            description: string;
            endpoints: ({
                method: string;
                path: string;
                description: string;
                permissions: string[];
                parameters: {
                    query: {
                        projectRoot: string;
                        feature: string;
                        model: string;
                        startDate?: undefined;
                        endDate?: undefined;
                        limit?: undefined;
                        offset?: undefined;
                        granularity?: undefined;
                    };
                };
                responses: {
                    200: string;
                    401: string;
                    403: string;
                    429: string;
                };
                example: {
                    request: string;
                    response: {
                        success: boolean;
                        data: {
                            current: {
                                date: string;
                                requestCount: number;
                                totalCost: number;
                                lastResetTime: string;
                                warningsShown: number[];
                            };
                            mlPredictions: {
                                dailyForecast: {
                                    timestamp: string;
                                    predictedCost: number;
                                }[];
                                recommendations: {
                                    type: string;
                                    description: string;
                                    potentialSavings: number;
                                }[];
                            };
                            history?: undefined;
                            pagination?: undefined;
                        };
                        timestamp: string;
                    };
                };
            } | {
                method: string;
                path: string;
                description: string;
                permissions: string[];
                parameters: {
                    query: {
                        startDate: string;
                        endDate: string;
                        limit: string;
                        offset: string;
                        granularity: string;
                        projectRoot?: undefined;
                        feature?: undefined;
                        model?: undefined;
                    };
                };
                example: {
                    request: string;
                    response: {
                        success: boolean;
                        data: {
                            history: {
                                date: string;
                                requestCount: number;
                                totalCost: number;
                                lastResetTime: string;
                                warningsShown: number[];
                            }[];
                            pagination: {
                                limit: number;
                                offset: number;
                                total: number;
                            };
                            current?: undefined;
                            mlPredictions?: undefined;
                        };
                        timestamp?: undefined;
                    };
                };
                responses?: undefined;
            })[];
        };
        configuration: {
            title: string;
            description: string;
            endpoints: ({
                method: string;
                path: string;
                description: string;
                permissions: string[];
                example: {
                    response: {
                        success: boolean;
                        data: {
                            configuration: {
                                enabled: boolean;
                                dailyLimit: number;
                                resetTime: string;
                                warningThresholds: number[];
                            };
                            changes?: undefined;
                        };
                    };
                    request?: undefined;
                };
                requestBody?: undefined;
            } | {
                method: string;
                path: string;
                description: string;
                permissions: string[];
                requestBody: {
                    enabled: string;
                    dailyLimit: string;
                    resetTime: string;
                    warningThresholds: string;
                };
                example: {
                    request: {
                        enabled: boolean;
                        dailyLimit: number;
                        resetTime: string;
                        warningThresholds: number[];
                    };
                    response: {
                        success: boolean;
                        data: {
                            configuration: {
                                enabled: boolean;
                                dailyLimit: number;
                                resetTime: string;
                                warningThresholds: number[];
                            };
                            changes: {
                                field: string;
                                previousValue: number;
                                newValue: number;
                                type: string;
                            }[];
                        };
                    };
                };
            })[];
        };
    };
    errorHandling: {
        title: string;
        description: string;
        format: {
            success: string;
            error: string;
            details: string;
            timestamp: string;
        };
        commonErrors: {
            400: {
                title: string;
                description: string;
                example: {
                    success: boolean;
                    error: string;
                    details: {
                        location: string;
                        errors: string[];
                    };
                    timestamp: string;
                };
            };
            401: {
                title: string;
                description: string;
                example: {
                    success: boolean;
                    error: string;
                    timestamp: string;
                };
            };
            403: {
                title: string;
                description: string;
                example: {
                    success: boolean;
                    error: string;
                    details: {
                        required: string[];
                        missing: string[];
                    };
                    timestamp: string;
                };
            };
            429: {
                title: string;
                description: string;
                example: {
                    success: boolean;
                    error: string;
                    details: {
                        limit: number;
                        window: string;
                        requests: number;
                        resetTime: string;
                    };
                    retryAfter: number;
                    timestamp: string;
                };
            };
        };
    };
    rateLimiting: {
        title: string;
        description: string;
        limits: {
            standard: string;
            strict: string;
            burst: string;
        };
        headers: {
            'X-RateLimit-Limit': string;
            'X-RateLimit-Remaining': string;
            'X-RateLimit-Reset': string;
            'X-RateLimit-Window': string;
            'Retry-After': string;
        };
    };
    websocketApi: {
        title: string;
        description: string;
        connectionUrl: string;
        authentication: string;
        messageTypes: {
            usage_update: {
                description: string;
                example: {
                    type: string;
                    data: {
                        date: string;
                        requestCount: number;
                        totalCost: number;
                        lastResetTime: string;
                    };
                    timestamp: string;
                    source: string;
                };
            };
            alert: {
                description: string;
                example: {
                    type: string;
                    data: {
                        alertType: string;
                        threshold: number;
                        currentUsage: number;
                        message: string;
                    };
                    timestamp: string;
                    source: string;
                };
            };
        };
        clientMessages: {
            subscribe: {
                description: string;
                example: {
                    type: string;
                    subscriptions: string[];
                };
            };
            ping: {
                description: string;
                example: {
                    type: string;
                };
            };
        };
    };
};
/**
 * Code examples for different programming languages
 */
export declare const codeExamples: {
    javascript: {
        title: string;
        examples: {
            getCurrentUsage: string;
            updateConfiguration: string;
            websocketConnection: string;
        };
    };
    python: {
        title: string;
        examples: {
            getCurrentUsage: string;
            updateConfiguration: string;
        };
    };
    curl: {
        title: string;
        examples: {
            getCurrentUsage: string;
            updateConfiguration: string;
            exportData: string;
        };
    };
};
/**
 * Export complete documentation object
 */
export declare const completeBudgetAPIDocumentation: {
    openApiSpec: {
        openapi: string;
        info: {
            title: string;
            description: string;
            version: string;
            contact: {
                name: string;
                email: string;
            };
            license: {
                name: string;
                url: string;
            };
        };
        servers: {
            url: string;
            description: string;
        }[];
        security: ({
            bearerAuth: any[];
            apiKeyAuth?: undefined;
            basicAuth?: undefined;
        } | {
            apiKeyAuth: any[];
            bearerAuth?: undefined;
            basicAuth?: undefined;
        } | {
            basicAuth: any[];
            bearerAuth?: undefined;
            apiKeyAuth?: undefined;
        })[];
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: string;
                    scheme: string;
                    bearerFormat: string;
                };
                apiKeyAuth: {
                    type: string;
                    in: string;
                    name: string;
                };
                basicAuth: {
                    type: string;
                    scheme: string;
                };
            };
            schemas: {
                BudgetSettings: {
                    type: string;
                    properties: {
                        enabled: {
                            type: string;
                            description: string;
                        };
                        dailyLimit: {
                            type: string;
                            description: string;
                            minimum: number;
                        };
                        resetTime: {
                            type: string;
                            pattern: string;
                            description: string;
                        };
                        warningThresholds: {
                            type: string;
                            items: {
                                type: string;
                                minimum: number;
                                maximum: number;
                            };
                            description: string;
                        };
                    };
                };
                BudgetUsageData: {
                    type: string;
                    properties: {
                        date: {
                            type: string;
                            format: string;
                            description: string;
                        };
                        requestCount: {
                            type: string;
                            description: string;
                        };
                        totalCost: {
                            type: string;
                            description: string;
                        };
                        lastResetTime: {
                            type: string;
                            format: string;
                            description: string;
                        };
                        warningsShown: {
                            type: string;
                            items: {
                                type: string;
                            };
                            description: string;
                        };
                    };
                    required: string[];
                };
                ApiResponse: {
                    type: string;
                    properties: {
                        success: {
                            type: string;
                            description: string;
                        };
                        data: {
                            type: string;
                            description: string;
                        };
                        error: {
                            type: string;
                            description: string;
                        };
                        timestamp: {
                            type: string;
                            format: string;
                            description: string;
                        };
                    };
                    required: string[];
                };
                ErrorResponse: {
                    type: string;
                    properties: {
                        success: {
                            type: string;
                            enum: boolean[];
                        };
                        error: {
                            type: string;
                            description: string;
                        };
                        details: {
                            type: string;
                            description: string;
                        };
                        timestamp: {
                            type: string;
                            format: string;
                        };
                    };
                    required: string[];
                };
            };
            responses: {
                UnauthorizedError: {
                    description: string;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                            example: {
                                success: boolean;
                                error: string;
                                timestamp: string;
                            };
                        };
                    };
                };
                ForbiddenError: {
                    description: string;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                            example: {
                                success: boolean;
                                error: string;
                                details: {
                                    required: string[];
                                    missing: string[];
                                };
                                timestamp: string;
                            };
                        };
                    };
                };
                RateLimitError: {
                    description: string;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                            example: {
                                success: boolean;
                                error: string;
                                details: {
                                    limit: number;
                                    window: string;
                                    requests: number;
                                    resetTime: string;
                                };
                                retryAfter: number;
                                timestamp: string;
                            };
                        };
                    };
                };
                ValidationError: {
                    description: string;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                            example: {
                                success: boolean;
                                error: string;
                                details: {
                                    location: string;
                                    errors: string[];
                                };
                                timestamp: string;
                            };
                        };
                    };
                };
            };
        };
        paths: {
            '/health': {
                get: {
                    summary: string;
                    description: string;
                    tags: string[];
                    security: any[];
                    responses: {
                        '200': {
                            description: string;
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: string;
                                    };
                                    example: {
                                        success: boolean;
                                        data: {
                                            status: string;
                                            timestamp: string;
                                            responseTime: number;
                                            components: {
                                                budgetTracker: {
                                                    status: string;
                                                    message: string;
                                                };
                                                mlAPI: {
                                                    status: string;
                                                    details: {
                                                        trackerInitialized: boolean;
                                                        dataAvailable: boolean;
                                                        modelsTrained: boolean;
                                                    };
                                                };
                                            };
                                            version: string;
                                        };
                                        timestamp: string;
                                    };
                                };
                            };
                        };
                        '503': {
                            description: string;
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: string;
                                    };
                                };
                            };
                        };
                    };
                };
            };
            '/usage': {
                get: {
                    summary: string;
                    description: string;
                    tags: string[];
                    parameters: {
                        name: string;
                        in: string;
                        schema: {
                            type: string;
                        };
                        description: string;
                    }[];
                    responses: {
                        '200': {
                            description: string;
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: ({
                                            $ref: string;
                                            properties?: undefined;
                                        } | {
                                            properties: {
                                                data: {
                                                    type: string;
                                                    properties: {
                                                        current: {
                                                            $ref: string;
                                                        };
                                                        mlPredictions: {
                                                            type: string;
                                                            description: string;
                                                        };
                                                    };
                                                };
                                            };
                                            $ref?: undefined;
                                        })[];
                                    };
                                };
                            };
                        };
                        '401': {
                            $ref: string;
                        };
                        '403': {
                            $ref: string;
                        };
                        '429': {
                            $ref: string;
                        };
                    };
                };
            };
            '/usage/history': {
                get: {
                    summary: string;
                    description: string;
                    tags: string[];
                    parameters: ({
                        name: string;
                        in: string;
                        schema: {
                            type: string;
                            format: string;
                            minimum?: undefined;
                            maximum?: undefined;
                            default?: undefined;
                            enum?: undefined;
                        };
                        description: string;
                    } | {
                        name: string;
                        in: string;
                        schema: {
                            type: string;
                            minimum: number;
                            maximum: number;
                            default: number;
                            format?: undefined;
                            enum?: undefined;
                        };
                        description: string;
                    } | {
                        name: string;
                        in: string;
                        schema: {
                            type: string;
                            minimum: number;
                            default: number;
                            format?: undefined;
                            maximum?: undefined;
                            enum?: undefined;
                        };
                        description: string;
                    } | {
                        name: string;
                        in: string;
                        schema: {
                            type: string;
                            enum: string[];
                            default: string;
                            format?: undefined;
                            minimum?: undefined;
                            maximum?: undefined;
                        };
                        description: string;
                    })[];
                    responses: {
                        '200': {
                            description: string;
                        };
                        '401': {
                            $ref: string;
                        };
                        '403': {
                            $ref: string;
                        };
                        '429': {
                            $ref: string;
                        };
                    };
                };
            };
            '/config': {
                get: {
                    summary: string;
                    description: string;
                    tags: string[];
                    responses: {
                        '200': {
                            description: string;
                            content: {
                                'application/json': {
                                    schema: {
                                        allOf: ({
                                            $ref: string;
                                            properties?: undefined;
                                        } | {
                                            properties: {
                                                data: {
                                                    type: string;
                                                    properties: {
                                                        configuration: {
                                                            $ref: string;
                                                        };
                                                    };
                                                };
                                            };
                                            $ref?: undefined;
                                        })[];
                                    };
                                };
                            };
                        };
                        '401': {
                            $ref: string;
                        };
                        '403': {
                            $ref: string;
                        };
                    };
                };
                post: {
                    summary: string;
                    description: string;
                    tags: string[];
                    requestBody: {
                        required: boolean;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                                example: {
                                    enabled: boolean;
                                    dailyLimit: number;
                                    resetTime: string;
                                    warningThresholds: number[];
                                };
                            };
                        };
                    };
                    responses: {
                        '200': {
                            description: string;
                        };
                        '400': {
                            $ref: string;
                        };
                        '401': {
                            $ref: string;
                        };
                        '403': {
                            $ref: string;
                        };
                    };
                };
            };
            '/analytics': {
                get: {
                    summary: string;
                    description: string;
                    tags: string[];
                    parameters: ({
                        name: string;
                        in: string;
                        schema: {
                            type: string;
                            format: string;
                            enum?: undefined;
                            default?: undefined;
                        };
                        description: string;
                    } | {
                        name: string;
                        in: string;
                        schema: {
                            type: string;
                            enum: string[];
                            default: string;
                            format?: undefined;
                        };
                        description: string;
                    })[];
                    responses: {
                        '200': {
                            description: string;
                        };
                        '401': {
                            $ref: string;
                        };
                        '403': {
                            $ref: string;
                        };
                    };
                };
            };
            '/export': {
                get: {
                    summary: string;
                    description: string;
                    tags: string[];
                    parameters: ({
                        name: string;
                        in: string;
                        required: boolean;
                        schema: {
                            type: string;
                            enum: string[];
                            format?: undefined;
                            default?: undefined;
                        };
                        description: string;
                    } | {
                        name: string;
                        in: string;
                        schema: {
                            type: string;
                            format: string;
                            enum?: undefined;
                            default?: undefined;
                        };
                        description: string;
                        required?: undefined;
                    } | {
                        name: string;
                        in: string;
                        schema: {
                            type: string;
                            default: boolean;
                            enum?: undefined;
                            format?: undefined;
                        };
                        description: string;
                        required?: undefined;
                    })[];
                    responses: {
                        '200': {
                            description: string;
                            content: {
                                'application/json': {
                                    description: string;
                                };
                                'text/csv': {
                                    description: string;
                                };
                                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                                    description: string;
                                };
                                'application/pdf': {
                                    description: string;
                                };
                            };
                        };
                        '400': {
                            $ref: string;
                        };
                        '401': {
                            $ref: string;
                        };
                        '403': {
                            $ref: string;
                        };
                    };
                };
            };
            '/stream': {
                get: {
                    summary: string;
                    description: string;
                    tags: string[];
                    responses: {
                        '101': {
                            description: string;
                        };
                        '400': {
                            description: string;
                        };
                        '401': {
                            $ref: string;
                        };
                    };
                };
            };
        };
        tags: {
            name: string;
            description: string;
        }[];
    };
    apiDocumentation: {
        title: string;
        version: string;
        description: string;
        authentication: {
            title: string;
            description: string;
            methods: {
                bearer: {
                    title: string;
                    description: string;
                    example: string;
                    usage: string;
                };
                apiKey: {
                    title: string;
                    description: string;
                    examples: string[];
                    usage: string;
                };
                basic: {
                    title: string;
                    description: string;
                    example: string;
                    usage: string;
                };
            };
        };
        endpoints: {
            usage: {
                title: string;
                description: string;
                endpoints: ({
                    method: string;
                    path: string;
                    description: string;
                    permissions: string[];
                    parameters: {
                        query: {
                            projectRoot: string;
                            feature: string;
                            model: string;
                            startDate?: undefined;
                            endDate?: undefined;
                            limit?: undefined;
                            offset?: undefined;
                            granularity?: undefined;
                        };
                    };
                    responses: {
                        200: string;
                        401: string;
                        403: string;
                        429: string;
                    };
                    example: {
                        request: string;
                        response: {
                            success: boolean;
                            data: {
                                current: {
                                    date: string;
                                    requestCount: number;
                                    totalCost: number;
                                    lastResetTime: string;
                                    warningsShown: number[];
                                };
                                mlPredictions: {
                                    dailyForecast: {
                                        timestamp: string;
                                        predictedCost: number;
                                    }[];
                                    recommendations: {
                                        type: string;
                                        description: string;
                                        potentialSavings: number;
                                    }[];
                                };
                                history?: undefined;
                                pagination?: undefined;
                            };
                            timestamp: string;
                        };
                    };
                } | {
                    method: string;
                    path: string;
                    description: string;
                    permissions: string[];
                    parameters: {
                        query: {
                            startDate: string;
                            endDate: string;
                            limit: string;
                            offset: string;
                            granularity: string;
                            projectRoot?: undefined;
                            feature?: undefined;
                            model?: undefined;
                        };
                    };
                    example: {
                        request: string;
                        response: {
                            success: boolean;
                            data: {
                                history: {
                                    date: string;
                                    requestCount: number;
                                    totalCost: number;
                                    lastResetTime: string;
                                    warningsShown: number[];
                                }[];
                                pagination: {
                                    limit: number;
                                    offset: number;
                                    total: number;
                                };
                                current?: undefined;
                                mlPredictions?: undefined;
                            };
                            timestamp?: undefined;
                        };
                    };
                    responses?: undefined;
                })[];
            };
            configuration: {
                title: string;
                description: string;
                endpoints: ({
                    method: string;
                    path: string;
                    description: string;
                    permissions: string[];
                    example: {
                        response: {
                            success: boolean;
                            data: {
                                configuration: {
                                    enabled: boolean;
                                    dailyLimit: number;
                                    resetTime: string;
                                    warningThresholds: number[];
                                };
                                changes?: undefined;
                            };
                        };
                        request?: undefined;
                    };
                    requestBody?: undefined;
                } | {
                    method: string;
                    path: string;
                    description: string;
                    permissions: string[];
                    requestBody: {
                        enabled: string;
                        dailyLimit: string;
                        resetTime: string;
                        warningThresholds: string;
                    };
                    example: {
                        request: {
                            enabled: boolean;
                            dailyLimit: number;
                            resetTime: string;
                            warningThresholds: number[];
                        };
                        response: {
                            success: boolean;
                            data: {
                                configuration: {
                                    enabled: boolean;
                                    dailyLimit: number;
                                    resetTime: string;
                                    warningThresholds: number[];
                                };
                                changes: {
                                    field: string;
                                    previousValue: number;
                                    newValue: number;
                                    type: string;
                                }[];
                            };
                        };
                    };
                })[];
            };
        };
        errorHandling: {
            title: string;
            description: string;
            format: {
                success: string;
                error: string;
                details: string;
                timestamp: string;
            };
            commonErrors: {
                400: {
                    title: string;
                    description: string;
                    example: {
                        success: boolean;
                        error: string;
                        details: {
                            location: string;
                            errors: string[];
                        };
                        timestamp: string;
                    };
                };
                401: {
                    title: string;
                    description: string;
                    example: {
                        success: boolean;
                        error: string;
                        timestamp: string;
                    };
                };
                403: {
                    title: string;
                    description: string;
                    example: {
                        success: boolean;
                        error: string;
                        details: {
                            required: string[];
                            missing: string[];
                        };
                        timestamp: string;
                    };
                };
                429: {
                    title: string;
                    description: string;
                    example: {
                        success: boolean;
                        error: string;
                        details: {
                            limit: number;
                            window: string;
                            requests: number;
                            resetTime: string;
                        };
                        retryAfter: number;
                        timestamp: string;
                    };
                };
            };
        };
        rateLimiting: {
            title: string;
            description: string;
            limits: {
                standard: string;
                strict: string;
                burst: string;
            };
            headers: {
                'X-RateLimit-Limit': string;
                'X-RateLimit-Remaining': string;
                'X-RateLimit-Reset': string;
                'X-RateLimit-Window': string;
                'Retry-After': string;
            };
        };
        websocketApi: {
            title: string;
            description: string;
            connectionUrl: string;
            authentication: string;
            messageTypes: {
                usage_update: {
                    description: string;
                    example: {
                        type: string;
                        data: {
                            date: string;
                            requestCount: number;
                            totalCost: number;
                            lastResetTime: string;
                        };
                        timestamp: string;
                        source: string;
                    };
                };
                alert: {
                    description: string;
                    example: {
                        type: string;
                        data: {
                            alertType: string;
                            threshold: number;
                            currentUsage: number;
                            message: string;
                        };
                        timestamp: string;
                        source: string;
                    };
                };
            };
            clientMessages: {
                subscribe: {
                    description: string;
                    example: {
                        type: string;
                        subscriptions: string[];
                    };
                };
                ping: {
                    description: string;
                    example: {
                        type: string;
                    };
                };
            };
        };
    };
    codeExamples: {
        javascript: {
            title: string;
            examples: {
                getCurrentUsage: string;
                updateConfiguration: string;
                websocketConnection: string;
            };
        };
        python: {
            title: string;
            examples: {
                getCurrentUsage: string;
                updateConfiguration: string;
            };
        };
        curl: {
            title: string;
            examples: {
                getCurrentUsage: string;
                updateConfiguration: string;
                exportData: string;
            };
        };
    };
    version: string;
    lastUpdated: string;
};
