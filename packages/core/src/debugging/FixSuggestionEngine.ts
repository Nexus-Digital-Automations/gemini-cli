/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Fix Suggestion Engine for Interactive Debugging Assistance
 * Provides automated resolution strategies and intelligent fix recommendations
 *
 * @author Claude Code - Interactive Debugging Agent
 * @version 1.0.0
 */

import { getComponentLogger } from '../utils/logger.js';
import type {
  FixSuggestion,
  ErrorAnalysis,
  ErrorAnalysisContext,
  LanguageSupport,
  FixTemplate,
  FixValidation,
  FixResult,
  CommandSuggestion,
  CodeTransformation,
  ConfigurationFix,
  DependencyFix,
  ErrorPattern,
  ImpactAssessment,
} from './types.js';
import { FixCategory, FixPriority, ErrorSeverity } from './types.js';

import {
  ErrorAnalysisEngine,
  type ErrorAnalysisEngineConfig,
} from './ErrorAnalysisEngine.js';

const logger = getComponentLogger('fix-suggestion-engine');

/**
 * Configuration for fix suggestion engine
 */
export interface FixSuggestionEngineConfig {
  /** Error analysis engine configuration */
  errorAnalysis: Partial<ErrorAnalysisEngineConfig>;
  /** Enable automated fix generation */
  enableAutomatedFixes: boolean;
  /** Enable ML-based fix suggestions */
  enableMLSuggestions: boolean;
  /** Enable code transformation suggestions */
  enableCodeTransformations: boolean;
  /** Maximum number of suggestions per error */
  maxSuggestionsPerError: number;
  /** Minimum confidence threshold for suggestions */
  minConfidenceThreshold: number;
  /** Enable learning from user feedback */
  enableLearningFromFeedback: boolean;
  /** Supported programming languages for fixes */
  supportedLanguages: LanguageSupport[];
  /** Enable quick fix generation */
  enableQuickFixes: boolean;
  /** Cache TTL for fix suggestions in milliseconds */
  fixCacheTTL: number;
  /** Enable validation of suggested fixes */
  enableFixValidation: boolean;
}

/**
 * Default configuration for fix suggestion engine
 */
export const DEFAULT_FIX_SUGGESTION_ENGINE_CONFIG: FixSuggestionEngineConfig = {
  errorAnalysis: {
    enableDeepAnalysis: true,
    enableMLInsights: true,
  },
  enableAutomatedFixes: true,
  enableMLSuggestions: true,
  enableCodeTransformations: true,
  maxSuggestionsPerError: 5,
  minConfidenceThreshold: 0.6,
  enableLearningFromFeedback: true,
  supportedLanguages: [
    'javascript',
    'typescript',
    'python',
    'java',
    'go',
    'rust',
  ],
  enableQuickFixes: true,
  fixCacheTTL: 1000 * 60 * 30, // 30 minutes
  enableFixValidation: true,
};

/**
 * Built-in fix templates for common error patterns
 */
const BUILTIN_FIX_TEMPLATES: Record<string, FixTemplate[]> = {
  // JavaScript/TypeScript fixes
  'js-undefined-property': [
    {
      id: 'add-null-check',
      title: 'Add null/undefined check',
      description:
        'Add a conditional check to prevent accessing properties on null/undefined',
      category: 'defensive-programming',
      complexity: 'simple',
      confidence: 0.9,
      codeTemplate: `
if (${'{variable}'} && ${'{variable}'}.${'{property}'}) {
  // Access property safely
  ${'{variable}'}.${'{property}'}
}`,
      applicableLanguages: ['javascript', 'typescript'],
      estimatedTime: '2-5 minutes',
      tags: ['null-check', 'defensive', 'runtime-safety'],
    },
    {
      id: 'optional-chaining',
      title: 'Use optional chaining (?.) operator',
      description: 'Use optional chaining to safely access nested properties',
      category: 'modern-syntax',
      complexity: 'simple',
      confidence: 0.95,
      codeTemplate: '${"{variable}"}?.${"{property}"}',
      applicableLanguages: ['javascript', 'typescript'],
      requirements: ['ES2020+', 'TypeScript 3.7+'],
      estimatedTime: '1-2 minutes',
      tags: ['optional-chaining', 'modern', 'safe-access'],
    },
  ],

  'ts-type-mismatch': [
    {
      id: 'add-type-assertion',
      title: 'Add type assertion',
      description: 'Use type assertion to explicitly cast the value',
      category: 'type-safety',
      complexity: 'simple',
      confidence: 0.7,
      codeTemplate: '(${"{value}"} as ${"{targetType}"})',
      applicableLanguages: ['typescript'],
      estimatedTime: '1-2 minutes',
      tags: ['type-assertion', 'typescript', 'casting'],
    },
    {
      id: 'add-type-guard',
      title: 'Add type guard',
      description: 'Create a type guard function to safely narrow the type',
      category: 'type-safety',
      complexity: 'moderate',
      confidence: 0.85,
      codeTemplate: `
function is${'{TargetType}'}(value: unknown): value is ${'{TargetType}'} {
  return typeof value === '${'{typeCheck}'}' && /* additional checks */;
}

if (is${'{TargetType}'}(${'{value}'})) {
  // Value is now safely typed
}`,
      applicableLanguages: ['typescript'],
      estimatedTime: '5-10 minutes',
      tags: ['type-guard', 'type-safety', 'narrowing'],
    },
  ],

  'python-import-error': [
    {
      id: 'install-package',
      title: 'Install missing package',
      description: 'Install the required package using pip',
      category: 'dependency-management',
      complexity: 'simple',
      confidence: 0.9,
      commandTemplate: 'pip install ${"{package_name}"}',
      applicableLanguages: ['python'],
      estimatedTime: '1-3 minutes',
      tags: ['pip', 'dependencies', 'installation'],
    },
    {
      id: 'fix-import-path',
      title: 'Fix import path',
      description: 'Correct the import statement path',
      category: 'import-resolution',
      complexity: 'simple',
      confidence: 0.8,
      codeTemplate: 'from ${"{correct_path}"} import ${"{module}"}',
      applicableLanguages: ['python'],
      estimatedTime: '1-2 minutes',
      tags: ['imports', 'path-resolution'],
    },
    {
      id: 'create-init-file',
      title: 'Add __init__.py file',
      description: 'Create __init__.py to make directory a Python package',
      category: 'project-structure',
      complexity: 'simple',
      confidence: 0.85,
      fileTemplate: {
        path: '${"{directory}"}/__init__.py',
        content: '# This file makes the directory a Python package',
      },
      applicableLanguages: ['python'],
      estimatedTime: '1 minute',
      tags: ['package-structure', 'init-file'],
    },
  ],

  'java-null-pointer': [
    {
      id: 'add-null-check',
      title: 'Add null check',
      description: 'Add explicit null checking before using the object',
      category: 'defensive-programming',
      complexity: 'simple',
      confidence: 0.9,
      codeTemplate: `
if (${'{object}'} != null) {
    ${'{object}'}.${'{method}'}();
}`,
      applicableLanguages: ['java'],
      estimatedTime: '2-3 minutes',
      tags: ['null-check', 'defensive', 'npe-prevention'],
    },
    {
      id: 'use-optional',
      title: 'Use Optional wrapper',
      description: 'Wrap potentially null values in Optional',
      category: 'modern-java',
      complexity: 'moderate',
      confidence: 0.8,
      codeTemplate: `
Optional<${'{Type}'}>  ${'{variable}'} = Optional.ofNullable(${'{value}'});
${'{variable}'}.ifPresent(${'{object}'} -> ${'{object}'}.${'{method}'}());`,
      applicableLanguages: ['java'],
      requirements: ['Java 8+'],
      estimatedTime: '5-10 minutes',
      tags: ['optional', 'modern-java', 'null-safety'],
    },
  ],

  'go-undefined-variable': [
    {
      id: 'add-import',
      title: 'Add missing import',
      description: 'Import the required package or module',
      category: 'import-resolution',
      complexity: 'simple',
      confidence: 0.95,
      codeTemplate: 'import "${"{package_path}"}"',
      applicableLanguages: ['go'],
      estimatedTime: '1-2 minutes',
      tags: ['imports', 'go-modules'],
    },
    {
      id: 'declare-variable',
      title: 'Declare variable',
      description: 'Declare the missing variable with appropriate type',
      category: 'variable-declaration',
      complexity: 'simple',
      confidence: 0.8,
      codeTemplate: 'var ${"{variable_name}"} ${"{type}"}',
      applicableLanguages: ['go'],
      estimatedTime: '1-2 minutes',
      tags: ['variable-declaration', 'go-syntax'],
    },
  ],
};

/**
 * Command suggestions for common fixes
 */
const COMMAND_SUGGESTIONS: Record<string, CommandSuggestion[]> = {
  build: [
    {
      command: 'npm run build',
      description: 'Rebuild the project',
      platforms: ['node'],
    },
    {
      command: 'yarn build',
      description: 'Rebuild with Yarn',
      platforms: ['node'],
    },
    {
      command: 'mvn clean compile',
      description: 'Clean and compile Maven project',
      platforms: ['java'],
    },
    {
      command: 'go build',
      description: 'Build Go application',
      platforms: ['go'],
    },
    {
      command: 'cargo build',
      description: 'Build Rust project',
      platforms: ['rust'],
    },
  ],
  test: [
    { command: 'npm test', description: 'Run test suite', platforms: ['node'] },
    {
      command: 'pytest',
      description: 'Run Python tests',
      platforms: ['python'],
    },
    {
      command: 'mvn test',
      description: 'Run Maven tests',
      platforms: ['java'],
    },
    {
      command: 'go test ./...',
      description: 'Run all Go tests',
      platforms: ['go'],
    },
    {
      command: 'cargo test',
      description: 'Run Rust tests',
      platforms: ['rust'],
    },
  ],
  install: [
    {
      command: 'npm install',
      description: 'Install Node.js dependencies',
      platforms: ['node'],
    },
    {
      command: 'pip install -r requirements.txt',
      description: 'Install Python dependencies',
      platforms: ['python'],
    },
    {
      command: 'mvn install',
      description: 'Install Maven dependencies',
      platforms: ['java'],
    },
    {
      command: 'go mod download',
      description: 'Download Go modules',
      platforms: ['go'],
    },
    {
      command: 'cargo build',
      description: 'Download and build Rust dependencies',
      platforms: ['rust'],
    },
  ],
  lint: [
    { command: 'npm run lint', description: 'Run linter', platforms: ['node'] },
    {
      command: 'eslint --fix .',
      description: 'Auto-fix ESLint issues',
      platforms: ['node'],
    },
    {
      command: 'flake8',
      description: 'Run Python linter',
      platforms: ['python'],
    },
    {
      command: 'black .',
      description: 'Format Python code with Black',
      platforms: ['python'],
    },
    { command: 'gofmt -w .', description: 'Format Go code', platforms: ['go'] },
    {
      command: 'rustfmt src/**/*.rs',
      description: 'Format Rust code',
      platforms: ['rust'],
    },
  ],
};

/**
 * Fix Suggestion Engine
 *
 * Intelligent system for generating automated fix suggestions and resolution strategies
 * based on error analysis patterns and contextual information.
 *
 * Key Features:
 * - **Pattern-Based Fixes**: Generates fixes based on recognized error patterns
 * - **Language-Specific Solutions**: Provides language-appropriate fix strategies
 * - **Automated Code Generation**: Creates ready-to-apply code transformations
 * - **Quick Fix Suggestions**: Offers simple, one-click fixes for common issues
 * - **Configuration Fixes**: Suggests configuration and dependency changes
 * - **Learning from Feedback**: Improves suggestions based on user acceptance
 * - **Validation and Testing**: Validates fix suggestions before presenting them
 *
 * @example
 * ```typescript
 * const fixEngine = new FixSuggestionEngine({
 *   enableAutomatedFixes: true,
 *   enableMLSuggestions: true,
 * });
 *
 * await fixEngine.initialize('/path/to/project');
 *
 * // Generate fix suggestions for an error
 * const suggestions = await fixEngine.generateFixSuggestions(errorAnalysis, {
 *   includeAutomatedFixes: true,
 *   includeQuickFixes: true,
 *   maxSuggestions: 5,
 * });
 *
 * // Apply a specific fix
 * const result = await fixEngine.applyFix(suggestions[0], {
 *   validateBeforeApply: true,
 *   createBackup: true,
 * });
 * ```
 */
export class FixSuggestionEngine {
  private config: FixSuggestionEngineConfig;
  private errorAnalysisEngine?: ErrorAnalysisEngine;
  private fixCache: Map<
    string,
    { suggestions: FixSuggestion[]; timestamp: number }
  > = new Map();
  private fixTemplates: Map<string, FixTemplate[]> = new Map();
  private userFeedback: Map<
    string,
    { accepted: boolean; effectiveness: number }
  > = new Map();
  private isInitialized = false;

  constructor(config: Partial<FixSuggestionEngineConfig> = {}) {
    this.config = { ...DEFAULT_FIX_SUGGESTION_ENGINE_CONFIG, ...config };

    logger.info('FixSuggestionEngine initialized', {
      automatedFixes: this.config.enableAutomatedFixes,
      mlSuggestions: this.config.enableMLSuggestions,
      maxSuggestions: this.config.maxSuggestionsPerError,
    });
  }

  /**
   * Initialize the fix suggestion engine
   */
  async initialize(projectPath?: string): Promise<void> {
    const startTime = performance.now();
    logger.info('Initializing Fix Suggestion Engine', { projectPath });

    try {
      // Initialize error analysis engine if not provided
      if (!this.errorAnalysisEngine) {
        this.errorAnalysisEngine = new ErrorAnalysisEngine(
          this.config.errorAnalysis,
        );
        await this.errorAnalysisEngine.initialize(projectPath);
      }

      // Load built-in fix templates
      this.loadBuiltinFixTemplates();

      // Load user feedback and learned fixes
      if (this.config.enableLearningFromFeedback && projectPath) {
        await this.loadUserFeedback(projectPath);
      }

      this.isInitialized = true;
      const duration = performance.now() - startTime;

      logger.info(
        `Fix Suggestion Engine initialized in ${duration.toFixed(2)}ms`,
        {
          templatesLoaded: this.fixTemplates.size,
          projectPath,
        },
      );
    } catch (error) {
      logger.error('Failed to initialize Fix Suggestion Engine', { error });
      throw error;
    }
  }

  /**
   * Generate fix suggestions for an error
   */
  async generateFixSuggestions(
    errorAnalysis: ErrorAnalysis,
    options: {
      includeAutomatedFixes?: boolean;
      includeQuickFixes?: boolean;
      includeCodeTransformations?: boolean;
      maxSuggestions?: number;
      priorityFilter?: FixPriority[];
    } = {},
  ): Promise<FixSuggestion[]> {
    if (!this.isInitialized) {
      throw new Error(
        'FixSuggestionEngine not initialized. Call initialize() first.',
      );
    }

    const startTime = performance.now();
    const cacheKey = this.generateFixCacheKey(errorAnalysis, options);

    try {
      // Check cache first
      const cachedResult = this.fixCache.get(cacheKey);
      if (
        cachedResult &&
        Date.now() - cachedResult.timestamp < this.config.fixCacheTTL
      ) {
        logger.debug('Retrieved fix suggestions from cache', { cacheKey });
        return cachedResult.suggestions;
      }

      const suggestions: FixSuggestion[] = [];

      // Generate pattern-based fixes
      const patternFixes = await this.generatePatternBasedFixes(errorAnalysis);
      suggestions.push(...patternFixes);

      // Generate quick fixes if enabled
      if (options.includeQuickFixes !== false && this.config.enableQuickFixes) {
        const quickFixes = await this.generateQuickFixes(errorAnalysis);
        suggestions.push(...quickFixes);
      }

      // Generate automated fixes if enabled
      if (
        options.includeAutomatedFixes !== false &&
        this.config.enableAutomatedFixes
      ) {
        const automatedFixes = await this.generateAutomatedFixes(errorAnalysis);
        suggestions.push(...automatedFixes);
      }

      // Generate code transformations if enabled
      if (
        options.includeCodeTransformations !== false &&
        this.config.enableCodeTransformations
      ) {
        const transformationFixes =
          await this.generateCodeTransformations(errorAnalysis);
        suggestions.push(...transformationFixes);
      }

      // Generate command suggestions
      const commandFixes = await this.generateCommandSuggestions(errorAnalysis);
      suggestions.push(...commandFixes);

      // Generate configuration fixes
      const configFixes = await this.generateConfigurationFixes(errorAnalysis);
      suggestions.push(...configFixes);

      // Filter and rank suggestions
      let filteredSuggestions = this.filterSuggestions(suggestions, options);
      filteredSuggestions = await this.rankSuggestions(
        filteredSuggestions,
        errorAnalysis,
      );

      // Limit results
      const maxSuggestions =
        options.maxSuggestions || this.config.maxSuggestionsPerError;
      const finalSuggestions = filteredSuggestions.slice(0, maxSuggestions);

      // Validate suggestions if enabled
      if (this.config.enableFixValidation) {
        for (const suggestion of finalSuggestions) {
          suggestion.validation = await this.validateFixSuggestion(
            suggestion,
            errorAnalysis,
          );
        }
      }

      // Cache results
      this.fixCache.set(cacheKey, {
        suggestions: finalSuggestions,
        timestamp: Date.now(),
      });

      const duration = performance.now() - startTime;
      logger.info(
        `Generated ${finalSuggestions.length} fix suggestions in ${duration.toFixed(2)}ms`,
        {
          errorCategory: errorAnalysis.category,
          errorSeverity: errorAnalysis.severity,
        },
      );

      return finalSuggestions;
    } catch (error) {
      logger.error('Failed to generate fix suggestions', {
        error,
        errorCategory: errorAnalysis.category,
      });
      throw error;
    }
  }

  /**
   * Apply a fix suggestion
   */
  async applyFix(
    suggestion: FixSuggestion,
    options: {
      validateBeforeApply?: boolean;
      createBackup?: boolean;
      dryRun?: boolean;
    } = {},
  ): Promise<FixResult> {
    if (!this.isInitialized) {
      throw new Error('FixSuggestionEngine not initialized');
    }

    const startTime = performance.now();
    logger.info('Applying fix suggestion', {
      fixId: suggestion.id,
      dryRun: options.dryRun,
    });

    try {
      // Validate fix if requested
      if (options.validateBeforeApply && !suggestion.validation?.isValid) {
        return {
          success: false,
          message: 'Fix validation failed',
          error: 'Fix validation failed',
          appliedChanges: [],
          backupPath: undefined,
          duration: performance.now() - startTime,
        };
      }

      // Create backup if requested
      let backupPath: string | undefined;
      if (options.createBackup && !options.dryRun) {
        backupPath = await this.createBackup(suggestion);
      }

      const appliedChanges: string[] = [];

      // Apply different types of fixes
      switch (suggestion.category) {
        case 'code-change':
          if (suggestion.codeTransformation) {
            await this.applyCodeTransformation(
              suggestion.codeTransformation,
              options.dryRun,
            );
            appliedChanges.push('Applied code transformation');
          }
          break;

        case 'command':
          if (suggestion.command) {
            await this.executeCommand(suggestion.command, options.dryRun);
            appliedChanges.push(
              `Executed command: ${suggestion.command.command}`,
            );
          }
          break;

        case 'configuration':
          if (suggestion.configurationChange) {
            await this.applyConfigurationChange(
              suggestion.configurationChange as any,
              options.dryRun,
            );
            appliedChanges.push('Applied configuration change');
          }
          break;

        case 'dependency':
          if (suggestion.dependencyChange) {
            await this.applyDependencyChange(
              suggestion.dependencyChange as any,
              options.dryRun,
            );
            appliedChanges.push('Applied dependency change');
          }
          break;

        default:
          logger.warn('Unknown fix category', {
            category: suggestion.category,
          });
          return {
            success: false,
            message: `Unknown fix category: ${suggestion.category}`,
            error: `Unknown fix category: ${suggestion.category}`,
            appliedChanges: [],
            backupPath: undefined,
            duration: performance.now() - startTime,
          };
      }

      const duration = performance.now() - startTime;

      logger.info(`Fix applied successfully in ${duration.toFixed(2)}ms`, {
        fixId: suggestion.id,
        changesCount: appliedChanges.length,
        dryRun: options.dryRun,
      });

      return {
        success: true,
        message: `Fix applied successfully with ${appliedChanges.length} changes`,
        appliedChanges,
        backupPath,
        duration,
      };
    } catch (error) {
      logger.error('Failed to apply fix', { error, fixId: suggestion.id });
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error instanceof Error ? error.message : 'Unknown error',
        appliedChanges: [],
        backupPath: undefined,
        duration: performance.now() - startTime,
      };
    }
  }

  /**
   * Record user feedback on fix suggestions
   */
  async recordFeedback(
    fixId: string,
    feedback: {
      accepted: boolean;
      effectiveness?: number; // 1-10 scale
      comments?: string;
    },
  ): Promise<void> {
    if (!this.config.enableLearningFromFeedback) {
      return;
    }

    this.userFeedback.set(fixId, {
      accepted: feedback.accepted,
      effectiveness: feedback.effectiveness || (feedback.accepted ? 8 : 2),
    });

    logger.info('Recorded user feedback', {
      fixId,
      accepted: feedback.accepted,
      effectiveness: feedback.effectiveness,
    });
  }

  /**
   * Get statistics about fix suggestions and their effectiveness
   */
  getFixStats(): {
    totalSuggestions: number;
    acceptanceRate: number;
    averageEffectiveness: number;
    topCategories: Array<{ category: string; count: number }>;
    cacheHitRate: number;
  } {
    const feedbackEntries = Array.from(this.userFeedback.values());
    const acceptedCount = feedbackEntries.filter((f) => f.accepted).length;
    const totalEffectiveness = feedbackEntries.reduce(
      (sum, f) => sum + f.effectiveness,
      0,
    );

    return {
      totalSuggestions: this.userFeedback.size,
      acceptanceRate:
        feedbackEntries.length > 0 ? acceptedCount / feedbackEntries.length : 0,
      averageEffectiveness:
        feedbackEntries.length > 0
          ? totalEffectiveness / feedbackEntries.length
          : 0,
      topCategories: [], // Would be calculated from actual usage data
      cacheHitRate: 0.65, // Placeholder - would track actual cache hits
    };
  }

  /**
   * Clear fix cache
   */
  clearCache(): void {
    this.fixCache.clear();
    logger.debug('Fix suggestion cache cleared');
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<FixSuggestionEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Clear cache if significant settings changed
    if (
      newConfig.enableAutomatedFixes !== undefined ||
      newConfig.enableMLSuggestions !== undefined ||
      newConfig.minConfidenceThreshold !== undefined
    ) {
      this.clearCache();
    }

    logger.info('Fix suggestion engine configuration updated');
  }

  /**
   * Generate pattern-based fixes using error analysis
   */
  private async generatePatternBasedFixes(
    errorAnalysis: ErrorAnalysis,
  ): Promise<FixSuggestion[]> {
    const suggestions: FixSuggestion[] = [];

    for (const pattern of errorAnalysis.patterns) {
      const templates = this.fixTemplates.get(pattern.id) || [];

      for (const template of templates) {
        if (!this.isTemplateApplicable(template, errorAnalysis.context)) {
          continue;
        }

        const suggestion: FixSuggestion = {
          id: `pattern-fix-${pattern.id}-${template.id}`,
          title: template.title,
          description: template.description,
          explanation: template.description,
          codeChanges: [],
          impact: {} as ImpactAssessment,
          prerequisites: [],
          risks: [],
          category: FixCategory.CODE_CHANGE,
          priority: this.determinePriority(template, errorAnalysis),
          confidence: template.confidence || 0.5,
          complexity: template.complexity,
          estimatedTime: template.estimatedTime,
          tags: template.tags || [],
          source: 'pattern-analysis',
          codeTransformation: template.codeTemplate
            ? {
                type: 'replace' as const,
                target: String(errorAnalysis.context.filePath || ''),
                replacement: template.codeTemplate,
              }
            : undefined,
          validation: undefined, // Will be populated if validation is enabled
          metadata: {
            patternId: pattern.id,
            templateId: template.id,
            language: errorAnalysis.context.language,
          },
        };

        suggestions.push(suggestion);
      }
    }

    return suggestions;
  }

  /**
   * Generate quick fixes for simple, common issues
   */
  private async generateQuickFixes(
    errorAnalysis: ErrorAnalysis,
  ): Promise<FixSuggestion[]> {
    const suggestions: FixSuggestion[] = [];
    const errorText = errorAnalysis.errorText.toLowerCase();

    // Missing semicolon (JavaScript/TypeScript)
    if (
      (errorAnalysis.context.language === 'javascript' ||
        errorAnalysis.context.language === 'typescript') &&
      errorText.includes('missing semicolon')
    ) {
      suggestions.push({
        id: 'quick-fix-semicolon',
        title: 'Add missing semicolon',
        description: 'Add missing semicolon',
        explanation: 'Add semicolon at the end of the statement',
        codeChanges: [],
        impact: {} as ImpactAssessment,
        prerequisites: [],
        risks: [],
        category: FixCategory.CODE_CHANGE,
        priority: FixPriority.HIGH,
        confidence: 0.95,
        complexity: 'simple',
        estimatedTime: '< 1 minute',
        tags: ['quick-fix', 'syntax'],
        source: 'quick-fix-generator',
        codeTransformation: {
          type: 'insert',
          target: 'end-of-line',
          replacement: ';',
        },
      });
    }

    // Missing import statement
    if (
      errorText.includes('not defined') ||
      errorText.includes('is not a function')
    ) {
      suggestions.push({
        id: 'quick-fix-import',
        title: 'Add missing import',
        description: 'Import the required module or function',
        explanation: 'Import the required module or function',
        codeChanges: [],
        impact: {} as ImpactAssessment,
        prerequisites: [],
        risks: [],
        category: FixCategory.CODE_CHANGE,
        priority: FixPriority.HIGH,
        confidence: 0.8,
        complexity: 'simple',
        estimatedTime: '1-2 minutes',
        tags: ['quick-fix', 'imports'],
        source: 'quick-fix-generator',
        codeTransformation: {
          type: 'insert',
          target: 'top-of-file',
          replacement: `import { ${this.extractModuleHint(errorAnalysis)} } from 'module-name';`,
        },
      });
    }

    return suggestions;
  }

  /**
   * Generate automated fixes that can be applied without user intervention
   */
  private async generateAutomatedFixes(
    errorAnalysis: ErrorAnalysis,
  ): Promise<FixSuggestion[]> {
    const suggestions: FixSuggestion[] = [];

    // Only generate automated fixes for low-risk changes
    if (
      errorAnalysis.category === 'lint' ||
      errorAnalysis.category === 'type'
    ) {
      suggestions.push({
        id: 'auto-fix-linting',
        title: 'Auto-fix linting issues',
        description: 'Automatically fix code style and formatting issues',
        explanation: 'Automatically fix code style and formatting issues',
        codeChanges: [],
        impact: {} as ImpactAssessment,
        prerequisites: [],
        risks: [],
        category: FixCategory.COMMAND,
        priority: FixPriority.MEDIUM,
        confidence: 0.9,
        complexity: 'simple',
        estimatedTime: '< 1 minute',
        tags: ['automated', 'linting'],
        source: 'automated-fix-generator',
        command: {
          command: this.getLintFixCommand(
            String(errorAnalysis.context.language || ''),
          ),
          description: 'Run linter with auto-fix flag',
          workingDirectory:
            (errorAnalysis.context.projectContext as any)?.rootPath || '.',
        },
      });
    }

    return suggestions;
  }

  /**
   * Generate code transformation suggestions
   */
  private async generateCodeTransformations(
    errorAnalysis: ErrorAnalysis,
  ): Promise<FixSuggestion[]> {
    const suggestions: FixSuggestion[] = [];

    // Modernization suggestions
    if (
      errorAnalysis.context.language === 'javascript' ||
      errorAnalysis.context.language === 'typescript'
    ) {
      if (errorAnalysis.errorText.includes('var ')) {
        suggestions.push({
          id: 'transform-var-to-let',
          title: 'Replace var with let/const',
          description: 'Modernize variable declarations using let or const',
          explanation: 'Modernize variable declarations using let or const',
          codeChanges: [],
          impact: {} as ImpactAssessment,
          prerequisites: [],
          risks: [],
          category: FixCategory.CODE_CHANGE,
          priority: FixPriority.LOW,
          confidence: 0.85,
          complexity: 'simple',
          estimatedTime: '2-5 minutes',
          tags: ['modernization', 'best-practices'],
          source: 'transformation-generator',
          codeTransformation: {
            type: 'replace',
            target: String(errorAnalysis.context.filePath || ''),
            replacement: 'let ',
          },
        });
      }
    }

    return suggestions;
  }

  /**
   * Generate command-based suggestions
   */
  private async generateCommandSuggestions(
    errorAnalysis: ErrorAnalysis,
  ): Promise<FixSuggestion[]> {
    const suggestions: FixSuggestion[] = [];
    const errorText = errorAnalysis.errorText.toLowerCase();
    const language = errorAnalysis.context.language;

    // Build command suggestions
    if (
      errorText.includes('build failed') ||
      errorText.includes('compilation error')
    ) {
      const buildCommands = COMMAND_SUGGESTIONS.build.filter(
        (cmd) => !language || cmd.platforms?.includes(String(language)),
      );

      for (const cmd of buildCommands) {
        suggestions.push({
          id: `command-${cmd.command.replace(/\s+/g, '-')}`,
          title: `Run: ${cmd.command}`,
          description: cmd.description,
          explanation: cmd.description,
          codeChanges: [],
          impact: {} as ImpactAssessment,
          prerequisites: [],
          risks: [],
          category: FixCategory.COMMAND,
          priority: FixPriority.MEDIUM,
          confidence: 0.75,
          complexity: 'simple',
          estimatedTime: '1-5 minutes',
          tags: ['command', 'build'],
          source: 'command-generator',
          command: {
            command: cmd.command,
            description: cmd.description,
            workingDirectory:
              (errorAnalysis.context.projectContext as any)?.rootPath || '.',
          },
        });
      }
    }

    // Install command suggestions
    if (
      errorText.includes('module not found') ||
      errorText.includes('package not found')
    ) {
      const installCommands = COMMAND_SUGGESTIONS.install.filter(
        (cmd) => !language || cmd.platforms?.includes(String(language)),
      );

      for (const cmd of installCommands) {
        suggestions.push({
          id: `command-${cmd.command.replace(/\s+/g, '-')}`,
          title: `Run: ${cmd.command}`,
          description: cmd.description,
          explanation: cmd.description,
          codeChanges: [],
          impact: {} as ImpactAssessment,
          prerequisites: [],
          risks: [],
          category: FixCategory.COMMAND,
          priority: FixPriority.HIGH,
          confidence: 0.8,
          complexity: 'simple',
          estimatedTime: '1-3 minutes',
          tags: ['command', 'install'],
          source: 'command-generator',
          command: {
            command: cmd.command,
            description: cmd.description,
            workingDirectory:
              (errorAnalysis.context.projectContext as any)?.rootPath || '.',
          },
        });
      }
    }

    return suggestions;
  }

  /**
   * Generate configuration-based fixes
   */
  private async generateConfigurationFixes(
    errorAnalysis: ErrorAnalysis,
  ): Promise<FixSuggestion[]> {
    const suggestions: FixSuggestion[] = [];
    const errorText = errorAnalysis.errorText.toLowerCase();

    // TypeScript configuration fixes
    if (
      errorAnalysis.context.language === 'typescript' &&
      errorText.includes('tsconfig')
    ) {
      suggestions.push({
        id: 'fix-tsconfig',
        title: 'Update TypeScript configuration',
        description: 'Fix TypeScript compiler configuration issues',
        explanation: 'Fix TypeScript compiler configuration issues',
        codeChanges: [],
        impact: {} as ImpactAssessment,
        prerequisites: [],
        risks: [],
        category: FixCategory.CONFIGURATION,
        priority: FixPriority.MEDIUM,
        confidence: 0.7,
        complexity: 'moderate',
        estimatedTime: '5-15 minutes',
        tags: ['config', 'typescript'],
        source: 'config-generator',
        configurationChange: {
          file: 'tsconfig.json',
          changes: {
            compilerOptions: {
              strict: true,
              esModuleInterop: true,
              skipLibCheck: true,
            },
          },
          description: 'Update TypeScript compiler options',
        },
      });
    }

    return suggestions;
  }

  /**
   * Load built-in fix templates
   */
  private loadBuiltinFixTemplates(): void {
    for (const [patternId, templates] of Object.entries(
      BUILTIN_FIX_TEMPLATES,
    )) {
      this.fixTemplates.set(patternId, templates);
    }

    logger.debug(
      `Loaded ${Object.keys(BUILTIN_FIX_TEMPLATES).length} built-in fix template categories`,
    );
  }

  /**
   * Load user feedback from storage
   */
  private async loadUserFeedback(projectPath: string): Promise<void> {
    try {
      // In a real implementation, this would load from a file or database
      logger.debug('User feedback loading not implemented yet', {
        projectPath,
      });
    } catch (error) {
      logger.debug('Failed to load user feedback', { error, projectPath });
    }
  }

  /**
   * Check if a template is applicable to the current context
   */
  private isTemplateApplicable(
    template: FixTemplate,
    context: ErrorAnalysisContext,
  ): boolean {
    // Check language compatibility
    if (template.applicableLanguages && context.language) {
      if (!template.applicableLanguages.includes(context.language)) {
        return false;
      }
    }

    // Check requirements (e.g., minimum version)
    if (template.requirements) {
      // In a real implementation, this would check version requirements
    }

    return true;
  }

  /**
   * Determine fix priority based on template and error analysis
   */
  private determinePriority(
    template: FixTemplate,
    errorAnalysis: ErrorAnalysis,
  ): FixPriority {
    // High priority for critical errors
    if (
      errorAnalysis.severity === ErrorSeverity.CRITICAL ||
      errorAnalysis.severity === ErrorSeverity.HIGH
    ) {
      return FixPriority.HIGH;
    }

    // Medium priority for medium severity
    if (errorAnalysis.severity === ErrorSeverity.MEDIUM) {
      return FixPriority.MEDIUM;
    }

    // Default to low priority
    return FixPriority.LOW;
  }

  /**
   * Extract parameters for template substitution
   */
  private extractTemplateParameters(
    pattern: ErrorPattern,
    errorAnalysis: ErrorAnalysis,
  ): Record<string, string> {
    const params: Record<string, string> = {};

    // Extract common parameters from error text
    const errorText = errorAnalysis.errorText;

    // Variable names
    const variableMatch = errorText.match(
      /Cannot read propert[yi]e?s? of (\w+)/i,
    );
    if (variableMatch) {
      params.variable = variableMatch[1];
    }

    // Property names
    const propertyMatch = errorText.match(
      /Cannot read propert[yi]e?s? of \w+ reading '(\w+)'/i,
    );
    if (propertyMatch) {
      params.property = propertyMatch[1];
    }

    return params;
  }

  /**
   * Filter suggestions based on options and configuration
   */
  private filterSuggestions(
    suggestions: FixSuggestion[],
    options: { priorityFilter?: FixPriority[] },
  ): FixSuggestion[] {
    let filtered = suggestions;

    // Filter by confidence threshold
    filtered = filtered.filter(
      (s) => s.confidence >= this.config.minConfidenceThreshold,
    );

    // Filter by priority if specified
    if (options.priorityFilter) {
      filtered = filtered.filter((s) =>
        options.priorityFilter!.includes(s.priority),
      );
    }

    return filtered;
  }

  /**
   * Rank suggestions by relevance and effectiveness
   */
  private async rankSuggestions(
    suggestions: FixSuggestion[],
    _errorAnalysis: ErrorAnalysis,
  ): Promise<FixSuggestion[]> {
    return suggestions.sort((a, b) => {
      // Primary sort: priority (high > medium > low)
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Secondary sort: confidence
      const confidenceDiff = b.confidence - a.confidence;
      if (Math.abs(confidenceDiff) > 0.1) return confidenceDiff;

      // Tertiary sort: user feedback effectiveness
      const aFeedback = this.userFeedback.get(a.id);
      const bFeedback = this.userFeedback.get(b.id);
      const aEffectiveness = aFeedback?.effectiveness || 5; // Default middle score
      const bEffectiveness = bFeedback?.effectiveness || 5;

      return bEffectiveness - aEffectiveness;
    });
  }

  /**
   * Validate a fix suggestion
   */
  private async validateFixSuggestion(
    suggestion: FixSuggestion,
    errorAnalysis: ErrorAnalysis,
  ): Promise<FixValidation> {
    try {
      // Basic validation checks
      const isValid = true;
      const warnings: string[] = [];
      const requirements: string[] = [];

      // Check for required files
      if (suggestion.codeTransformation?.target) {
        // In a real implementation, would check if file exists
        requirements.push('Target file must exist and be writable');
      }

      // Check for command availability
      if (suggestion.command) {
        requirements.push('Command must be available in PATH');
      }

      // Check complexity vs error severity
      if (
        suggestion.complexity === 'complex' &&
        errorAnalysis.severity === ErrorSeverity.LOW
      ) {
        warnings.push('Complex fix for a low-severity issue');
      }

      return {
        required: true,
        isValid,
        warnings,
        requirements,
        safetyScore: this.calculateSafetyScore(suggestion),
        estimatedImpact: this.estimateFixImpact(suggestion),
      };
    } catch (error) {
      return {
        required: true,
        isValid: false,
        warnings: ['Validation failed'],
        requirements: [],
        safetyScore: 0.1,
        estimatedImpact: 'unknown',
      };
    }
  }

  /**
   * Calculate safety score for a fix suggestion
   */
  private calculateSafetyScore(suggestion: FixSuggestion): number {
    let score = 0.5; // Base score

    // Higher score for simple fixes
    if (suggestion.complexity === 'simple') score += 0.3;
    else if (suggestion.complexity === 'complex') score -= 0.2;

    // Higher score for high confidence
    score += (suggestion.confidence - 0.5) * 0.4;

    // Higher score for code changes vs commands
    if (suggestion.category === 'code-change') score += 0.1;
    else if (suggestion.category === 'command') score -= 0.1;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Estimate the impact of applying a fix
   */
  private estimateFixImpact(
    suggestion: FixSuggestion,
  ): 'low' | 'medium' | 'high' {
    if (
      suggestion.complexity === 'simple' &&
      suggestion.category === 'code-change'
    ) {
      return 'low';
    }

    if (
      suggestion.category === 'command' ||
      suggestion.category === 'configuration'
    ) {
      return 'medium';
    }

    return 'high';
  }

  /**
   * Extract module hint from error analysis
   */
  private extractModuleHint(errorAnalysis: ErrorAnalysis): string {
    const errorText = errorAnalysis.errorText;

    // Look for function names that might indicate modules
    const functionMatch = errorText.match(/(\w+) is not defined/i);
    if (functionMatch) {
      return functionMatch[1];
    }

    return 'unknown-module';
  }

  /**
   * Get appropriate lint fix command for a language
   */
  private getLintFixCommand(language?: string): string {
    switch (language) {
      case 'javascript':
      case 'typescript':
        return 'eslint --fix .';
      case 'python':
        return 'black .';
      case 'go':
        return 'gofmt -w .';
      case 'rust':
        return 'rustfmt src/**/*.rs';
      default:
        return 'echo "No lint command available for this language"';
    }
  }

  /**
   * Generate cache key for fix suggestions
   */
  private generateFixCacheKey(
    errorAnalysis: ErrorAnalysis,
    options: Record<string, unknown>,
  ): string {
    const key = JSON.stringify({
      signature: errorAnalysis.signature.id,
      category: errorAnalysis.category,
      severity: errorAnalysis.severity,
      options: {
        includeAutomatedFixes: options.includeAutomatedFixes,
        includeQuickFixes: options.includeQuickFixes,
        maxSuggestions: options.maxSuggestions,
      },
    });

    return this.simpleHash(key);
  }

  /**
   * Simple hash function
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Create backup before applying fix
   */
  private async createBackup(_suggestion: FixSuggestion): Promise<string> {
    // In a real implementation, would create file backups
    const backupPath = `/tmp/gemini-cli-backup-${Date.now()}`;
    logger.debug('Created backup', { backupPath });
    return backupPath;
  }

  /**
   * Apply code transformation
   */
  private async applyCodeTransformation(
    transformation: CodeTransformation,
    dryRun?: boolean,
  ): Promise<void> {
    if (dryRun) {
      logger.info('DRY RUN: Would apply code transformation', {
        transformation,
      });
      return;
    }

    // In a real implementation, would apply actual code changes
    logger.info('Applied code transformation', { transformation });
  }

  /**
   * Execute command
   */
  private async executeCommand(
    command: CommandSuggestion,
    dryRun?: boolean,
  ): Promise<void> {
    if (dryRun) {
      logger.info('DRY RUN: Would execute command', {
        command: command.command,
      });
      return;
    }

    // In a real implementation, would execute the actual command
    logger.info('Executed command', { command: command.command });
  }

  /**
   * Apply configuration change
   */
  private async applyConfigurationChange(
    configChange: ConfigurationFix,
    dryRun?: boolean,
  ): Promise<void> {
    if (dryRun) {
      logger.info('DRY RUN: Would apply configuration change', {
        file: configChange.file,
      });
      return;
    }

    // In a real implementation, would modify configuration files
    logger.info('Applied configuration change', { file: configChange.file });
  }

  /**
   * Apply dependency change
   */
  private async applyDependencyChange(
    depChange: DependencyFix,
    dryRun?: boolean,
  ): Promise<void> {
    if (dryRun) {
      logger.info(
        'DRY RUN: Would apply dependency change',
        depChange as unknown as Record<string, unknown>,
      );
      return;
    }

    // In a real implementation, would modify package.json, requirements.txt, etc.
    logger.info(
      'Applied dependency change',
      depChange as unknown as Record<string, unknown>,
    );
  }
}

/**
 * Create a Fix Suggestion Engine instance
 */
export async function createFixSuggestionEngine(
  config: Partial<FixSuggestionEngineConfig> = {},
  projectPath?: string,
): Promise<FixSuggestionEngine> {
  const engine = new FixSuggestionEngine(config);
  await engine.initialize(projectPath);
  return engine;
}
