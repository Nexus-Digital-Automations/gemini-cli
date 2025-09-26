/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DebugCodeTemplate, DebugCodeSnippet, InstrumentationCode, DebugGenerationOptions, LanguageSupport, DebugCodeType, TestCaseGeneration, ErrorAnalysis } from './types.js';
/**
 * Configuration for debug code generator
 */
export interface DebugCodeGeneratorConfig {
    /** Default programming language for code generation */
    defaultLanguage: LanguageSupport;
    /** Enable test case generation */
    enableTestGeneration: boolean;
    /** Enable performance instrumentation */
    enablePerformanceInstrumentation: boolean;
    /** Enable automated logging injection */
    enableAutomatedLogging: boolean;
    /** Code style preferences */
    codeStyle: {
        indentation: 'spaces' | 'tabs';
        indentSize: number;
        semicolons: boolean;
        quotes: 'single' | 'double';
    };
    /** Maximum generated code length */
    maxCodeLength: number;
    /** Template cache TTL in milliseconds */
    templateCacheTTL: number;
    /** Enable code validation before generation */
    enableCodeValidation: boolean;
    /** Custom template directories */
    customTemplatePaths: string[];
}
/**
 * Default configuration for debug code generator
 */
export declare const DEFAULT_DEBUG_CODE_GENERATOR_CONFIG: DebugCodeGeneratorConfig;
/**
 * Debug Code Generator
 *
 * Intelligent system for generating debugging code, instrumentation, and testing utilities
 * across multiple programming languages to assist in error investigation and code analysis.
 *
 * Key Features:
 * - **Multi-Language Support**: Generates debugging code for JavaScript, TypeScript, Python, Java, Go, and more
 * - **Context-Aware Generation**: Creates relevant debugging code based on error context and code analysis
 * - **Template-Based System**: Extensible template system with built-in and custom templates
 * - **Instrumentation Code**: Generates performance monitoring, logging, and error handling code
 * - **Test Case Generation**: Creates unit tests, integration tests, and test fixtures
 * - **Code Validation**: Validates generated code for syntax and best practices
 * - **Customizable Styling**: Respects project code style preferences
 *
 * @example
 * ```typescript
 * const codeGenerator = new DebugCodeGenerator({
 *   defaultLanguage: 'typescript',
 *   enableTestGeneration: true,
 * });
 *
 * await codeGenerator.initialize();
 *
 * // Generate logging code
 * const loggingCode = await codeGenerator.generateDebugCode({
 *   type: 'logging',
 *   language: 'typescript',
 *   context: {
 *     variable: 'userData',
 *     location: 'UserService.createUser',
 *   },
 * });
 *
 * // Generate test case
 * const testCode = await codeGenerator.generateTestCase({
 *   functionName: 'validateEmail',
 *   language: 'javascript',
 *   testScenarios: ['valid email', 'invalid email', 'empty string'],
 * });
 * ```
 */
export declare class DebugCodeGenerator {
    private config;
    private templates;
    private templateCache;
    private isInitialized;
    constructor(config?: Partial<DebugCodeGeneratorConfig>);
    /**
     * Initialize the debug code generator
     */
    initialize(): Promise<void>;
    /**
     * Generate debug code based on context and requirements
     */
    generateDebugCode(options: DebugGenerationOptions): Promise<DebugCodeSnippet>;
    /**
     * Generate instrumentation code for error context
     */
    generateInstrumentationCode(errorAnalysis: ErrorAnalysis, instrumentationType?: 'logging' | 'performance' | 'error-handling' | 'all'): Promise<InstrumentationCode>;
    /**
     * Generate test case code for reproducing errors
     */
    generateTestCase(options: TestCaseGeneration & {
        errorContext?: ErrorAnalysis;
        includeErrorScenario?: boolean;
    }): Promise<DebugCodeSnippet>;
    /**
     * Generate validation code for runtime checks
     */
    generateValidationCode(variable: string, expectedType: string, language?: LanguageSupport): Promise<DebugCodeSnippet>;
    /**
     * Get available templates for a language and type
     */
    getAvailableTemplates(language: LanguageSupport, type?: DebugCodeType): DebugCodeTemplate[];
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<DebugCodeGeneratorConfig>): void;
    /**
     * Clear template cache
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        hitRate: number;
    };
    /**
     * Load built-in templates
     */
    private loadBuiltinTemplates;
    /**
     * Load custom templates from file system
     */
    private loadCustomTemplates;
    /**
     * Get templates for specific language and type
     */
    private getTemplatesForLanguage;
    /**
     * Generate code from template with parameter substitution
     */
    private generateFromTemplate;
    /**
     * Apply code style preferences to generated code
     */
    private applyCodeStyle;
    /**
     * Validate generated code syntax and structure
     */
    private validateGeneratedCode;
    /**
     * Generate usage instructions for template
     */
    private generateUsageInstructions;
    /**
     * Estimate implementation effort for generated code
     */
    private estimateImplementationEffort;
    /**
     * Extract location information from error analysis
     */
    private extractLocationFromError;
    /**
     * Extract operation name from error analysis
     */
    private extractOperationFromError;
    /**
     * Generate instrumentation instructions
     */
    private generateInstrumentationInstructions;
    /**
     * Generate validation condition based on type and language
     */
    private generateValidationCondition;
    /**
     * Capitalize first letter of string
     */
    private capitalizeFirstLetter;
}
/**
 * Create a Debug Code Generator instance
 */
export declare function createDebugCodeGenerator(config?: Partial<DebugCodeGeneratorConfig>): Promise<DebugCodeGenerator>;
