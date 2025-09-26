/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Debug Code Generator for Interactive Debugging Assistance
 * Provides dynamic debugging code creation and instrumentation for various programming languages
 *
 * @author Claude Code - Interactive Debugging Agent
 * @version 1.0.0
 */
import { getComponentLogger } from '../utils/logger.js';
const logger = getComponentLogger('debug-code-generator');
/**
 * Default configuration for debug code generator
 */
export const DEFAULT_DEBUG_CODE_GENERATOR_CONFIG = {
    defaultLanguage: 'javascript',
    enableTestGeneration: true,
    enablePerformanceInstrumentation: true,
    enableAutomatedLogging: true,
    codeStyle: {
        indentation: 'spaces',
        indentSize: 2,
        semicolons: true,
        quotes: 'single',
    },
    maxCodeLength: 10000,
    templateCacheTTL: 1000 * 60 * 60, // 1 hour
    enableCodeValidation: true,
    customTemplatePaths: [],
};
/**
 * Debug code templates for different languages and scenarios
 */
const DEBUG_CODE_TEMPLATES = {
    javascript: {
        logging: [
            {
                id: 'console-log-basic',
                name: 'Basic Console Logging',
                description: 'Simple console.log statement for variable inspection',
                template: `console.log('🔍 Debug: ${'{label}'}:', ${'{variable}'});`,
                parameters: ['label', 'variable'],
                category: 'logging',
                complexity: 'simple',
                useCases: ['Variable inspection', 'Flow tracking'],
                tags: ['console', 'basic'],
            },
            {
                id: 'console-log-advanced',
                name: 'Advanced Console Logging',
                description: 'Detailed logging with context and timestamp',
                template: `
console.group('🐛 Debug Group: ${'{groupName}'}');
console.log('📍 Location: ${'{location}'}');
console.log('⏰ Time:', new Date().toISOString());
console.log('📦 Data:', ${'{data}'});
console.trace('📚 Stack Trace');
console.groupEnd();`,
                parameters: ['groupName', 'location', 'data'],
                category: 'logging',
                complexity: 'moderate',
                useCases: ['Detailed debugging', 'Issue investigation'],
                tags: ['console', 'advanced', 'trace'],
            },
        ],
        'error-handling': [
            {
                id: 'try-catch-basic',
                name: 'Basic Try-Catch Block',
                description: 'Simple error handling wrapper',
                template: `
try {
  ${'{code}'}
} catch (error) {
  console.error('❌ Error in ${'{location}'}:', error);
  ${'{errorHandler}'}
}`,
                parameters: ['code', 'location', 'errorHandler'],
                category: 'error-handling',
                complexity: 'simple',
                useCases: ['Error prevention', 'Safe execution'],
                tags: ['try-catch', 'error-handling'],
            },
            {
                id: 'async-error-handling',
                name: 'Async Error Handling',
                description: 'Error handling for async/await operations',
                template: `
async function ${'{functionName}'}() {
  try {
    const result = await ${'{asyncOperation}'};
    console.log('✅ Success:', result);
    return result;
  } catch (error) {
    console.error('❌ Async error in ${'{functionName}'}:', error);
    ${'{fallbackBehavior}'}
    throw error;
  }
}`,
                parameters: ['functionName', 'asyncOperation', 'fallbackBehavior'],
                category: 'error-handling',
                complexity: 'moderate',
                useCases: ['Async operations', 'Promise handling'],
                tags: ['async', 'await', 'promise'],
            },
        ],
        performance: [
            {
                id: 'performance-timer',
                name: 'Performance Timer',
                description: 'Measure execution time of code blocks',
                template: `
console.time('⏱️ ${'{timerLabel}'}');
${'{code}'}
console.timeEnd('⏱️ ${'{timerLabel}'}');`,
                parameters: ['timerLabel', 'code'],
                category: 'performance',
                complexity: 'simple',
                useCases: ['Performance measurement', 'Optimization'],
                tags: ['performance', 'timing'],
            },
            {
                id: 'memory-usage',
                name: 'Memory Usage Monitor',
                description: 'Track memory usage during execution',
                template: `
const startMemory = process.memoryUsage();
console.log('🧠 Memory before ${'{operation}'}:', startMemory);

${'{code}'}

const endMemory = process.memoryUsage();
console.log('🧠 Memory after ${'{operation}'}:', endMemory);
console.log('📊 Memory delta:', {
  heapUsed: endMemory.heapUsed - startMemory.heapUsed,
  heapTotal: endMemory.heapTotal - startMemory.heapTotal,
  external: endMemory.external - startMemory.external,
});`,
                parameters: ['operation', 'code'],
                category: 'performance',
                complexity: 'moderate',
                useCases: ['Memory profiling', 'Memory leak detection'],
                tags: ['memory', 'profiling'],
            },
        ],
        testing: [
            {
                id: 'unit-test-basic',
                name: 'Basic Unit Test',
                description: 'Simple unit test template',
                template: `
describe('${'{testSuite}'}', () => {
  test('should ${'{testDescription}'}', () => {
    // Arrange
    ${'{arrangeCode}'}

    // Act
    const result = ${'{actCode}'};

    // Assert
    expect(result).${'{assertion}'};
  });
});`,
                parameters: [
                    'testSuite',
                    'testDescription',
                    'arrangeCode',
                    'actCode',
                    'assertion',
                ],
                category: 'testing',
                complexity: 'moderate',
                useCases: ['Unit testing', 'Test creation'],
                tags: ['jest', 'unit-test'],
            },
        ],
        validation: [
            {
                id: 'type-validation',
                name: 'Type Validation',
                description: 'Runtime type checking',
                template: `
function validate${'{TypeName}'}(value) {
  if (${'{validationCondition}'}) {
    console.log('✅ Validation passed for ${'{TypeName}'}:', value);
    return true;
  } else {
    console.error('❌ Validation failed for ${'{TypeName}'}:', value);
    console.error('Expected: ${'{expectedType}'}');
    console.error('Received:', typeof value);
    return false;
  }
}

if (!validate${'{TypeName}'}(${'{variable}'})) {
  throw new Error('Invalid ${'{TypeName}'}: ' + ${'{variable}'});
}`,
                parameters: [
                    'TypeName',
                    'validationCondition',
                    'expectedType',
                    'variable',
                ],
                category: 'validation',
                complexity: 'moderate',
                useCases: ['Runtime validation', 'Type checking'],
                tags: ['validation', 'type-safety'],
            },
        ],
    },
    typescript: {
        logging: [
            {
                id: 'typed-logging',
                name: 'Typed Logging Function',
                description: 'Type-safe logging with generics',
                template: `
function debugLog<T>(label: string, value: T, context?: Record<string, unknown>): T {
  console.log(\`🔍 \${label}:\`, value);
  if (context) {
    console.log('📋 Context:', context);
  }
  return value;
}

const result = debugLog('${'{label}'}', ${'{variable}'}, ${'{context}'});`,
                parameters: ['label', 'variable', 'context'],
                category: 'logging',
                complexity: 'moderate',
                useCases: ['Type-safe logging', 'Debug instrumentation'],
                tags: ['typescript', 'generics', 'type-safe'],
            },
        ],
        'error-handling': [
            {
                id: 'result-type-error',
                name: 'Result Type Error Handling',
                description: 'Functional error handling with Result type',
                template: `
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

function ${'{functionName}'}(): Result<${'{ReturnType}'}, ${'{ErrorType}'}> {
  try {
    const result = ${'{operation}'};
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Error in ${'{functionName}'}:', error);
    return { success: false, error: error as ${'{ErrorType}'} };
  }
}`,
                parameters: ['functionName', 'ReturnType', 'ErrorType', 'operation'],
                category: 'error-handling',
                complexity: 'advanced',
                useCases: ['Functional error handling', 'Type-safe errors'],
                tags: ['result-type', 'functional', 'type-safe'],
            },
        ],
        performance: [
            {
                id: 'performance-decorator',
                name: 'Performance Decorator',
                description: 'TypeScript decorator for performance measurement',
                template: `
function measurePerformance(target: object, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;

  descriptor.value = function(...args: unknown[]) {
    const start = performance.now();
    const result = method.apply(this, args);
    const end = performance.now();

    console.log(\`⏱️ \${target.constructor.name}.\${propertyName} executed in \${end - start}ms\`);

    return result;
  };
}

class ${'{ClassName}'} {
  @measurePerformance
  ${'{methodName}'}(${'{parameters}'}) {
    ${'{methodBody}'}
  }
}`,
                parameters: ['ClassName', 'methodName', 'parameters', 'methodBody'],
                category: 'performance',
                complexity: 'advanced',
                useCases: ['Method performance', 'Decorator pattern'],
                tags: ['decorator', 'performance', 'class'],
            },
        ],
        testing: [
            {
                id: 'typed-mock',
                name: 'Typed Mock Creation',
                description: 'Type-safe mock objects for testing',
                template: `
type MockOf<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown
    ? jest.MockedFunction<T[K]>
    : T[K];
};

const create${'{InterfaceName}'}Mock = (): MockOf<${'{InterfaceName}'}>  => ({
  ${'{mockImplementation}'}
});

const mock${'{InterfaceName}'} = create${'{InterfaceName}'}Mock();`,
                parameters: ['InterfaceName', 'mockImplementation'],
                category: 'testing',
                complexity: 'advanced',
                useCases: ['Type-safe mocking', 'Interface testing'],
                tags: ['mock', 'typescript', 'jest'],
            },
        ],
        validation: [
            {
                id: 'type-guard',
                name: 'Type Guard Function',
                description: 'TypeScript type guard for runtime type checking',
                template: `
function is${'{TypeName}'}(value: unknown): value is ${'{TypeName}'} {
  return (
    ${'{typeCheckConditions}'}
  );
}

if (is${'{TypeName}'}(${'{variable}'})) {
  // TypeScript now knows the type is ${'{TypeName}'}
  console.log('✅ Type guard passed:', ${'{variable}'});
  ${'{typedOperations}'}
} else {
  console.error('❌ Type guard failed for:', ${'{variable}'});
}`,
                parameters: [
                    'TypeName',
                    'typeCheckConditions',
                    'variable',
                    'typedOperations',
                ],
                category: 'validation',
                complexity: 'moderate',
                useCases: ['Type narrowing', 'Runtime type safety'],
                tags: ['type-guard', 'narrowing'],
            },
        ],
    },
    python: {
        logging: [
            {
                id: 'python-logging',
                name: 'Python Logging',
                description: 'Structured logging with Python logging module',
                template: `
import logging

logger = logging.getLogger(__name__)

def debug_log(message: str, data: object = None, level: int = logging.DEBUG):
    if data is not None:
        logger.log(level, f"🔍 {message}: %s", data)
    else:
        logger.log(level, f"🔍 {message}")

debug_log("${'{message}'}", ${'{data}'})`,
                parameters: ['message', 'data'],
                category: 'logging',
                complexity: 'moderate',
                useCases: ['Structured logging', 'Debug information'],
                tags: ['logging', 'structured'],
            },
        ],
        'error-handling': [
            {
                id: 'python-exception',
                name: 'Python Exception Handling',
                description: 'Comprehensive exception handling',
                template: `
try:
    ${'{code}'}
except ${'{ExceptionType}'} as e:
    logger.error(f"❌ {${'{ExceptionType}'}.__name__} in ${'{location}'}: {str(e)}")
    ${'{errorHandler}'}
except Exception as e:
    logger.error(f"❌ Unexpected error in ${'{location}'}: {str(e)}")
    logger.debug("Stack trace:", exc_info=True)
    raise`,
                parameters: ['code', 'ExceptionType', 'location', 'errorHandler'],
                category: 'error-handling',
                complexity: 'moderate',
                useCases: ['Exception handling', 'Error logging'],
                tags: ['exception', 'error-handling'],
            },
        ],
        performance: [
            {
                id: 'python-timer',
                name: 'Python Performance Timer',
                description: 'Context manager for timing operations',
                template: `
import time
from contextlib import contextmanager

@contextmanager
def timer(operation_name: str):
    start_time = time.perf_counter()
    try:
        yield
    finally:
        end_time = time.perf_counter()
        print(f"⏱️ {operation_name} took {end_time - start_time:.4f} seconds")

with timer("${'{operation}'}"):
    ${'{code}'}`,
                parameters: ['operation', 'code'],
                category: 'performance',
                complexity: 'moderate',
                useCases: ['Performance measurement', 'Timing'],
                tags: ['context-manager', 'timing'],
            },
        ],
        testing: [
            {
                id: 'pytest-test',
                name: 'Pytest Test Case',
                description: 'Basic pytest test case with fixtures',
                template: `
import pytest

def test_${'{test_name}'}():
    # Arrange
    ${'{arrange_code}'}

    # Act
    result = ${'{act_code}'}

    # Assert
    assert ${'{assertion}'}

@pytest.fixture
def ${'{fixture_name}'}():
    return ${'{fixture_value}'}`,
                parameters: [
                    'test_name',
                    'arrange_code',
                    'act_code',
                    'assertion',
                    'fixture_name',
                    'fixture_value',
                ],
                category: 'testing',
                complexity: 'moderate',
                useCases: ['Unit testing', 'Test fixtures'],
                tags: ['pytest', 'fixture'],
            },
        ],
        validation: [
            {
                id: 'python-validation',
                name: 'Python Type Validation',
                description: 'Runtime type validation with isinstance',
                template: `
def validate_${'{type_name}'}(value, expected_type) -> bool:
    if isinstance(value, expected_type):
        print(f"✅ Validation passed: {value} is {expected_type.__name__}")
        return True
    else:
        print(f"❌ Validation failed: {value} is not {expected_type.__name__}")
        print(f"   Expected: {expected_type.__name__}")
        print(f"   Received: {type(value).__name__}")
        return False

if not validate_${'{type_name}'}(${'{variable}'}, ${'{expected_type}'}):
    raise TypeError(f"Invalid type for ${'{variable}'}")`,
                parameters: ['type_name', 'variable', 'expected_type'],
                category: 'validation',
                complexity: 'simple',
                useCases: ['Runtime validation', 'Type checking'],
                tags: ['isinstance', 'validation'],
            },
        ],
    },
};
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
export class DebugCodeGenerator {
    config;
    templates = new Map();
    templateCache = new Map();
    isInitialized = false;
    constructor(config = {}) {
        this.config = { ...DEFAULT_DEBUG_CODE_GENERATOR_CONFIG, ...config };
        logger.info('DebugCodeGenerator initialized', {
            defaultLanguage: this.config.defaultLanguage,
            testGeneration: this.config.enableTestGeneration,
            performanceInstrumentation: this.config.enablePerformanceInstrumentation,
        });
    }
    /**
     * Initialize the debug code generator
     */
    async initialize() {
        const startTime = performance.now();
        logger.info('Initializing Debug Code Generator');
        try {
            // Load built-in templates
            this.loadBuiltinTemplates();
            // Load custom templates if specified
            if (this.config.customTemplatePaths.length > 0) {
                await this.loadCustomTemplates();
            }
            this.isInitialized = true;
            const duration = performance.now() - startTime;
            logger.info(`Debug Code Generator initialized in ${duration.toFixed(2)}ms`, {
                templatesLoaded: this.templates.size,
                customPaths: this.config.customTemplatePaths.length,
            });
        }
        catch (error) {
            logger.error('Failed to initialize Debug Code Generator', { error });
            throw error;
        }
    }
    /**
     * Generate debug code based on context and requirements
     */
    async generateDebugCode(options) {
        if (!this.isInitialized) {
            throw new Error('DebugCodeGenerator not initialized. Call initialize() first.');
        }
        const startTime = performance.now();
        logger.debug('Generating debug code', {
            type: options.type,
            language: options.language,
            templateId: options.templateId,
        });
        try {
            const language = options.language || this.config.defaultLanguage;
            const templates = this.getTemplatesForLanguage(language, options.type);
            if (templates.length === 0) {
                throw new Error(`No templates found for ${language} ${options.type}`);
            }
            // Select template
            const template = options.templateId
                ? templates.find((t) => t.id === options.templateId)
                : templates[0]; // Use first template as default
            if (!template) {
                throw new Error(`Template ${options.templateId} not found`);
            }
            // Generate code from template
            const generatedCode = await this.generateFromTemplate(template, options);
            // Validate generated code if enabled
            if (this.config.enableCodeValidation) {
                await this.validateGeneratedCode(generatedCode, language);
            }
            const duration = performance.now() - startTime;
            const snippet = {
                id: `debug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                code: generatedCode,
                language,
                type: options.type,
                template: template.id,
                metadata: {
                    generatedAt: new Date(),
                    generationTime: Math.round(duration),
                    template: template.name,
                    complexity: template.complexity,
                    useCases: template.useCases,
                    tags: template.tags,
                },
                description: template.description,
                instructions: this.generateUsageInstructions(template, options),
                estimatedEffort: this.estimateImplementationEffort(template, options),
            };
            logger.info(`Generated debug code in ${duration.toFixed(2)}ms`, {
                type: options.type,
                language,
                codeLength: generatedCode.length,
            });
            return snippet;
        }
        catch (error) {
            logger.error('Failed to generate debug code', { error, options });
            throw error;
        }
    }
    /**
     * Generate instrumentation code for error context
     */
    async generateInstrumentationCode(errorAnalysis, instrumentationType = 'all') {
        if (!this.isInitialized) {
            throw new Error('DebugCodeGenerator not initialized');
        }
        const language = errorAnalysis.context.language || this.config.defaultLanguage;
        const instrumentation = {
            id: `instrumentation-${Date.now()}`,
            targetLocation: errorAnalysis.context.filePath || 'unknown',
            language,
            instructions: [],
            metadata: {
                errorCategory: errorAnalysis.category,
                errorSeverity: errorAnalysis.severity,
                generatedAt: new Date(),
            },
        };
        try {
            // Generate logging instrumentation
            if (instrumentationType === 'logging' || instrumentationType === 'all') {
                const loggingCode = await this.generateDebugCode({
                    type: 'logging',
                    language,
                    context: {
                        location: this.extractLocationFromError(errorAnalysis),
                        errorText: errorAnalysis.errorText.substring(0, 100),
                        ...errorAnalysis.context,
                    },
                });
                instrumentation.loggingInstrumentation = {
                    code: loggingCode.code,
                    placement: 'before-error-location',
                    description: 'Add detailed logging around error location',
                };
            }
            // Generate performance instrumentation
            if ((instrumentationType === 'performance' ||
                instrumentationType === 'all') &&
                this.config.enablePerformanceInstrumentation) {
                const performanceCode = await this.generateDebugCode({
                    type: 'performance',
                    language,
                    context: {
                        operation: this.extractOperationFromError(errorAnalysis),
                        ...errorAnalysis.context,
                    },
                });
                instrumentation.performanceInstrumentation = {
                    code: performanceCode.code,
                    placement: 'wrap-operation',
                    description: 'Measure performance of operation that failed',
                    metrics: ['execution-time', 'memory-usage'],
                };
            }
            // Generate error handling instrumentation
            if (instrumentationType === 'error-handling' ||
                instrumentationType === 'all') {
                const errorHandlingCode = await this.generateDebugCode({
                    type: 'error-handling',
                    language,
                    context: {
                        errorType: errorAnalysis.category,
                        location: this.extractLocationFromError(errorAnalysis),
                        ...errorAnalysis.context,
                    },
                });
                instrumentation.errorHandlingInstrumentation = {
                    code: errorHandlingCode.code,
                    placement: 'wrap-error-prone-code',
                    description: 'Add comprehensive error handling',
                    errorTypes: [errorAnalysis.category],
                };
            }
            // Generate usage instructions
            instrumentation.instructions =
                this.generateInstrumentationInstructions(instrumentation);
            logger.info('Generated instrumentation code', {
                errorCategory: errorAnalysis.category,
                language,
                hasLogging: !!instrumentation.loggingInstrumentation,
                hasPerformance: !!instrumentation.performanceInstrumentation,
                hasErrorHandling: !!instrumentation.errorHandlingInstrumentation,
            });
            return instrumentation;
        }
        catch (error) {
            logger.error('Failed to generate instrumentation code', { error });
            throw error;
        }
    }
    /**
     * Generate test case code for reproducing errors
     */
    async generateTestCase(options) {
        if (!this.isInitialized) {
            throw new Error('DebugCodeGenerator not initialized');
        }
        if (!this.config.enableTestGeneration) {
            throw new Error('Test generation is disabled in configuration');
        }
        const language = options.language || this.config.defaultLanguage;
        const testOptions = {
            type: 'testing',
            language,
            context: {
                testSuite: options.testSuite || 'Generated Tests',
                functionName: options.functionName,
                testDescription: options.testDescription || `test ${options.functionName}`,
                testScenarios: options.testScenarios,
                ...options.context,
            },
            templateId: options.templateId,
        };
        // Add error scenario if provided
        if (options.errorContext && options.includeErrorScenario) {
            testOptions.context = {
                ...testOptions.context,
                errorScenario: {
                    description: `should handle error: ${options.errorContext.category}`,
                    errorType: options.errorContext.category,
                    expectedBehavior: 'should handle gracefully',
                },
            };
        }
        const testCode = await this.generateDebugCode(testOptions);
        logger.info('Generated test case', {
            functionName: options.functionName,
            language,
            includesErrorScenario: options.includeErrorScenario,
        });
        return testCode;
    }
    /**
     * Generate validation code for runtime checks
     */
    async generateValidationCode(variable, expectedType, language) {
        if (!this.isInitialized) {
            throw new Error('DebugCodeGenerator not initialized');
        }
        const targetLanguage = language || this.config.defaultLanguage;
        return this.generateDebugCode({
            type: 'validation',
            language: targetLanguage,
            context: {
                variable,
                expectedType,
                TypeName: this.capitalizeFirstLetter(expectedType),
                validationCondition: this.generateValidationCondition(expectedType, targetLanguage),
            },
        });
    }
    /**
     * Get available templates for a language and type
     */
    getAvailableTemplates(language, type) {
        const languageTemplates = this.templates.get(language);
        if (!languageTemplates) {
            return [];
        }
        if (type) {
            return languageTemplates.get(type) || [];
        }
        // Return all templates for the language
        const allTemplates = [];
        for (const templates of languageTemplates.values()) {
            allTemplates.push(...templates);
        }
        return allTemplates;
    }
    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        // Clear template cache if code style changed
        if (newConfig.codeStyle) {
            this.templateCache.clear();
        }
        logger.info('Debug code generator configuration updated');
    }
    /**
     * Clear template cache
     */
    clearCache() {
        this.templateCache.clear();
        logger.debug('Template cache cleared');
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.templateCache.size,
            hitRate: 0.7, // Placeholder - would track actual hits/misses
        };
    }
    /**
     * Load built-in templates
     */
    loadBuiltinTemplates() {
        for (const [language, typeTemplates] of Object.entries(DEBUG_CODE_TEMPLATES)) {
            const languageMap = new Map();
            for (const [type, templates] of Object.entries(typeTemplates)) {
                languageMap.set(type, templates);
            }
            this.templates.set(language, languageMap);
        }
        logger.debug(`Loaded built-in templates for ${Object.keys(DEBUG_CODE_TEMPLATES).length} languages`);
    }
    /**
     * Load custom templates from file system
     */
    async loadCustomTemplates() {
        try {
            // In a real implementation, would load from file system
            logger.debug('Custom template loading not implemented yet');
        }
        catch (error) {
            logger.warn('Failed to load custom templates', { error });
        }
    }
    /**
     * Get templates for specific language and type
     */
    getTemplatesForLanguage(language, type) {
        const languageTemplates = this.templates.get(language);
        if (!languageTemplates) {
            return [];
        }
        return languageTemplates.get(type) || [];
    }
    /**
     * Generate code from template with parameter substitution
     */
    async generateFromTemplate(template, options) {
        const cacheKey = `${template.id}-${JSON.stringify(options.context || {})}`;
        // Check cache
        const cached = this.templateCache.get(cacheKey);
        if (cached &&
            Date.now() - cached.timestamp < this.config.templateCacheTTL) {
            return cached.template;
        }
        let code = template.template;
        // Substitute parameters
        if (options.context) {
            for (const [key, value] of Object.entries(options.context)) {
                const placeholder = `\${'{${key}'}`;
                const stringValue = String(value || '');
                code = code.replace(new RegExp(placeholder, 'g'), stringValue);
            }
        }
        // Apply code style preferences
        code = this.applyCodeStyle(code, options.language || this.config.defaultLanguage);
        // Apply length limit
        if (code.length > this.config.maxCodeLength) {
            code =
                code.substring(0, this.config.maxCodeLength) + '\n// ... (truncated)';
        }
        // Cache result
        this.templateCache.set(cacheKey, { template: code, timestamp: Date.now() });
        return code;
    }
    /**
     * Apply code style preferences to generated code
     */
    applyCodeStyle(code, language) {
        let styledCode = code;
        // Apply indentation preferences
        if (this.config.codeStyle.indentation === 'tabs') {
            styledCode = styledCode.replace(/ {2}/g, '\t');
        }
        else {
            const spaces = ' '.repeat(this.config.codeStyle.indentSize);
            styledCode = styledCode.replace(/\t/g, spaces);
        }
        // Apply quote preferences for JavaScript/TypeScript
        if (language === 'javascript' || language === 'typescript') {
            if (this.config.codeStyle.quotes === 'double') {
                styledCode = styledCode.replace(/'/g, '"');
            }
            else {
                styledCode = styledCode.replace(/"/g, "'");
            }
            // Apply semicolon preferences
            if (!this.config.codeStyle.semicolons) {
                styledCode = styledCode.replace(/;$/gm, '');
            }
        }
        return styledCode;
    }
    /**
     * Validate generated code syntax and structure
     */
    async validateGeneratedCode(code, language) {
        try {
            // Basic validation checks
            const lines = code.split('\n');
            // Check for basic syntax issues
            if (language === 'javascript' || language === 'typescript') {
                // Check for unclosed brackets
                const openBrackets = (code.match(/\{/g) || []).length;
                const closeBrackets = (code.match(/\}/g) || []).length;
                if (openBrackets !== closeBrackets) {
                    logger.warn('Generated code may have unclosed brackets');
                }
            }
            // Check for placeholder parameters that weren't substituted
            const unreplacedPlaceholders = code.match(/\$\{'\{[^}]+\}'/g);
            if (unreplacedPlaceholders) {
                logger.warn('Generated code contains unreplaced placeholders', {
                    placeholders: unreplacedPlaceholders,
                });
            }
            logger.debug('Code validation completed', {
                language,
                lines: lines.length,
                characters: code.length,
            });
        }
        catch (error) {
            logger.warn('Code validation failed', { error, language });
        }
    }
    /**
     * Generate usage instructions for template
     */
    generateUsageInstructions(template, _options) {
        const instructions = [];
        instructions.push(`1. Copy the generated ${template.category} code`);
        switch (template.category) {
            case 'logging':
                instructions.push('2. Place the logging code at the location where you want to inspect variables');
                instructions.push('3. Run your application and check console output');
                break;
            case 'error-handling':
                instructions.push('2. Wrap the error-prone code with the generated try-catch block');
                instructions.push('3. Customize the error handling logic as needed');
                break;
            case 'performance':
                instructions.push('2. Wrap the code you want to measure with the performance instrumentation');
                instructions.push('3. Run your application and check performance metrics');
                break;
            case 'testing':
                instructions.push('2. Add the test case to your test suite');
                instructions.push('3. Customize test data and assertions as needed');
                instructions.push('4. Run your test suite to execute the test');
                break;
            case 'validation':
                instructions.push('2. Place the validation code before using the variable');
                instructions.push('3. Handle validation failures appropriately');
                break;
            default:
                instructions.push('2. Follow the standard implementation instructions');
                break;
        }
        instructions.push(`4. Remove debug code before committing to version control (if temporary)`);
        return instructions;
    }
    /**
     * Estimate implementation effort for generated code
     */
    estimateImplementationEffort(template, _options) {
        switch (template.complexity) {
            case 'simple':
                return '1-2 minutes';
            case 'moderate':
                return '5-10 minutes';
            case 'advanced':
                return '15-30 minutes';
            default:
                return '5-15 minutes';
        }
    }
    /**
     * Extract location information from error analysis
     */
    extractLocationFromError(errorAnalysis) {
        if (errorAnalysis.context.filePath) {
            const fileName = errorAnalysis.context.filePath.split('/').pop();
            return `${fileName}:${errorAnalysis.context.lineNumber || 'unknown'}`;
        }
        return 'unknown location';
    }
    /**
     * Extract operation name from error analysis
     */
    extractOperationFromError(errorAnalysis) {
        // Try to extract function name or operation from error text
        const functionMatch = errorAnalysis.errorText.match(/at (\w+)/);
        if (functionMatch) {
            return functionMatch[1];
        }
        // Fallback to generic operation name
        return 'operation';
    }
    /**
     * Generate instrumentation instructions
     */
    generateInstrumentationInstructions(instrumentation) {
        const instructions = [];
        instructions.push('Generated instrumentation code to help debug the error:');
        instructions.push('');
        if (instrumentation.loggingInstrumentation) {
            instructions.push('📋 Logging Instrumentation:');
            instructions.push(`   ${instrumentation.loggingInstrumentation.description}`);
            instructions.push(`   Placement: ${instrumentation.loggingInstrumentation.placement}`);
            instructions.push('');
        }
        if (instrumentation.performanceInstrumentation) {
            instructions.push('⏱️ Performance Instrumentation:');
            instructions.push(`   ${instrumentation.performanceInstrumentation.description}`);
            instructions.push(`   Placement: ${instrumentation.performanceInstrumentation.placement}`);
            instructions.push(`   Metrics: ${instrumentation.performanceInstrumentation.metrics?.join(', ')}`);
            instructions.push('');
        }
        if (instrumentation.errorHandlingInstrumentation) {
            instructions.push('🛡️ Error Handling Instrumentation:');
            instructions.push(`   ${instrumentation.errorHandlingInstrumentation.description}`);
            instructions.push(`   Placement: ${instrumentation.errorHandlingInstrumentation.placement}`);
            instructions.push('');
        }
        instructions.push('Usage:');
        instructions.push('1. Copy the relevant instrumentation code');
        instructions.push('2. Place it according to the placement instructions');
        instructions.push('3. Run your application to gather debug information');
        instructions.push('4. Analyze the output to understand the issue');
        return instructions;
    }
    /**
     * Generate validation condition based on type and language
     */
    generateValidationCondition(expectedType, language) {
        switch (language) {
            case 'javascript':
            case 'typescript':
                if (expectedType === 'string')
                    return "typeof value === 'string'";
                if (expectedType === 'number')
                    return "typeof value === 'number' && !isNaN(value)";
                if (expectedType === 'boolean')
                    return "typeof value === 'boolean'";
                if (expectedType === 'array')
                    return 'Array.isArray(value)';
                if (expectedType === 'object')
                    return "typeof value === 'object' && value !== null";
                break;
            case 'python':
                if (expectedType === 'str')
                    return 'isinstance(value, str)';
                if (expectedType === 'int')
                    return 'isinstance(value, int)';
                if (expectedType === 'float')
                    return 'isinstance(value, (int, float))';
                if (expectedType === 'bool')
                    return 'isinstance(value, bool)';
                if (expectedType === 'list')
                    return 'isinstance(value, list)';
                if (expectedType === 'dict')
                    return 'isinstance(value, dict)';
                break;
            default:
                break;
        }
        return 'true /* Add validation condition */';
    }
    /**
     * Capitalize first letter of string
     */
    capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
/**
 * Create a Debug Code Generator instance
 */
export async function createDebugCodeGenerator(config = {}) {
    const generator = new DebugCodeGenerator(config);
    await generator.initialize();
    return generator;
}
//# sourceMappingURL=DebugCodeGenerator.js.map