/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Context-Aware Suggestion Engine
 * Leverages historical context for intelligent suggestions and workflow optimization
 *
 * @author Claude Code - Advanced Context Retention Agent
 * @version 1.0.0
 */
import { getComponentLogger } from '../utils/logger.js';
import { ContextPrioritizer } from './ContextPrioritizer.js';
import { CrossSessionStorage } from './CrossSessionStorage.js';
const logger = getComponentLogger('suggestion-engine');
/**
 * Default configuration for suggestion engine
 */
export const DEFAULT_SUGGESTION_ENGINE_CONFIG = {
  minConfidenceThreshold: 0.3,
  maxSuggestions: 10,
  enablePatternLearning: true,
  historicalPatternWeight: 0.4,
  currentContextWeight: 0.6,
  enableWorkflowOptimization: true,
  minPatternFrequency: 3,
  patternCacheSize: 1000,
};
/**
 * Context-Aware Suggestion Engine
 *
 * The SuggestionEngine leverages historical context to provide intelligent suggestions
 * and workflow optimizations. It learns from user interactions, recognizes patterns,
 * and provides contextual recommendations to improve productivity.
 *
 * Key Features:
 * - Pattern Recognition: Learns from past user interactions and behaviors
 * - Contextual Completions: Provides suggestions based on current project context
 * - Workflow Optimization: Identifies opportunities to streamline common tasks
 * - Error Prevention: Warns about potential issues based on historical context
 * - Learning from Mistakes: Remembers and helps avoid repeated errors
 *
 * @example
 * ```typescript
 * const suggestionEngine = new SuggestionEngine();
 * await suggestionEngine.trackInteraction(userInteraction);
 * const suggestions = await suggestionEngine.generateSuggestions(currentContext);
 * console.log(`Generated ${suggestions.length} suggestions`);
 * ```
 */
export class SuggestionEngine {
  config;
  prioritizer;
  storage;
  interactionHistory = [];
  learnedPatterns = new Map();
  suggestionCache = new Map();
  workflowPatterns = new Map();
  constructor(storage, config = {}) {
    this.config = { ...DEFAULT_SUGGESTION_ENGINE_CONFIG, ...config };
    this.prioritizer = new ContextPrioritizer();
    this.storage = storage;
    logger.info('SuggestionEngine initialized', {
      minConfidenceThreshold: this.config.minConfidenceThreshold,
      patternLearning: this.config.enablePatternLearning,
      workflowOptimization: this.config.enableWorkflowOptimization,
    });
  }
  /**
   * Initialize the suggestion engine with historical data
   */
  async initialize(projectPath) {
    const startTime = performance.now();
    logger.info('Initializing suggestion engine with historical data');
    try {
      // Load historical sessions for pattern learning
      const sessions = await this.storage.getRelatedSessions(projectPath, 50);
      // Extract interaction patterns from sessions
      await this.extractPatternsFromSessions(sessions);
      // Load any persisted learned patterns
      await this.loadLearnedPatterns(projectPath);
      const duration = performance.now() - startTime;
      logger.info(`Suggestion engine initialized in ${duration.toFixed(2)}ms`, {
        sessionsLoaded: sessions.length,
        patternsLearned: this.learnedPatterns.size,
      });
    } catch (error) {
      logger.error('Failed to initialize suggestion engine', { error });
      throw error;
    }
  }
  /**
   * Generate contextual suggestions based on current state
   */
  async generateSuggestions(currentContext, codeContext, recentInteractions) {
    const startTime = performance.now();
    logger.debug('Generating contextual suggestions', {
      contextLength: currentContext.length,
      hasCodeContext: !!codeContext,
      recentInteractionsCount: recentInteractions?.length || 0,
    });
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(currentContext, codeContext);
      const cached = this.suggestionCache.get(cacheKey);
      if (cached) {
        logger.debug('Returning cached suggestions', { count: cached.length });
        return cached;
      }
      const suggestions = [];
      // Generate different types of suggestions
      const patternSuggestions =
        await this.generatePatternBasedSuggestions(currentContext);
      const codeSuggestions = codeContext
        ? await this.generateCodeContextSuggestions(codeContext)
        : [];
      const workflowSuggestions = await this.generateWorkflowSuggestions(
        currentContext,
        recentInteractions,
      );
      const errorPreventionSuggestions =
        await this.generateErrorPreventionSuggestions(
          currentContext,
          codeContext,
        );
      const optimizationSuggestions =
        await this.generateOptimizationSuggestions(currentContext, codeContext);
      // Combine all suggestions
      suggestions.push(
        ...patternSuggestions,
        ...codeSuggestions,
        ...workflowSuggestions,
        ...errorPreventionSuggestions,
        ...optimizationSuggestions,
      );
      // Filter by confidence threshold and limit count
      const filteredSuggestions = suggestions
        .filter(
          (suggestion) =>
            suggestion.confidence >= this.config.minConfidenceThreshold,
        )
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, this.config.maxSuggestions);
      // Cache the results
      this.suggestionCache.set(cacheKey, filteredSuggestions);
      const duration = performance.now() - startTime;
      logger.info(
        `Generated ${filteredSuggestions.length} suggestions in ${duration.toFixed(2)}ms`,
        {
          patternBased: patternSuggestions.length,
          codeBased: codeSuggestions.length,
          workflowBased: workflowSuggestions.length,
          errorPrevention: errorPreventionSuggestions.length,
          optimization: optimizationSuggestions.length,
        },
      );
      return filteredSuggestions;
    } catch (error) {
      logger.error('Failed to generate suggestions', { error });
      return [];
    }
  }
  /**
   * Generate suggestions based on learned patterns
   */
  async generatePatternBasedSuggestions(currentContext) {
    const suggestions = [];
    if (!this.config.enablePatternLearning) {
      return suggestions;
    }
    const contextLower = currentContext.toLowerCase();
    for (const pattern of this.learnedPatterns.values()) {
      // Check if pattern triggers match current context
      const matchingTriggers = pattern.triggers.filter((trigger) =>
        contextLower.includes(trigger.toLowerCase()),
      );
      if (matchingTriggers.length > 0) {
        const confidence = this.calculatePatternConfidence(
          pattern,
          matchingTriggers,
          currentContext,
        );
        if (confidence >= this.config.minConfidenceThreshold) {
          suggestions.push({
            type: 'workflow',
            suggestion: pattern.suggestion,
            confidence,
            reasoning: `Based on ${pattern.frequency} similar situations where this approach was successful`,
            historicalContext: [
              `Pattern: ${pattern.description}`,
              `Success rate: ${(pattern.successRate * 100).toFixed(1)}%`,
            ],
            estimatedBenefit:
              pattern.frequency > 10
                ? 'High time savings based on frequent usage'
                : 'Moderate time savings',
            warnings:
              pattern.userFeedback === 'negative'
                ? ['User previously indicated this suggestion was not helpful']
                : undefined,
          });
        }
      }
    }
    return suggestions;
  }
  /**
   * Generate code-specific suggestions
   */
  async generateCodeContextSuggestions(codeContext) {
    const suggestions = [];
    // Suggest relevant functions based on recent changes
    if (codeContext.recentChanges.length > 0) {
      const recentFiles = new Set(
        codeContext.recentChanges.map((change) => change.filePath),
      );
      const relevantFunctions = codeContext.activeFunctions.filter((func) =>
        recentFiles.has(func.filePath),
      );
      if (relevantFunctions.length > 0) {
        suggestions.push({
          type: 'code',
          suggestion: `Consider reviewing these related functions: ${relevantFunctions
            .slice(0, 3)
            .map((f) => f.name)
            .join(', ')}`,
          confidence: 0.7,
          reasoning:
            'These functions are in files you recently modified and may need attention',
          historicalContext: relevantFunctions.map(
            (f) => `${f.name} in ${f.filePath}`,
          ),
          estimatedBenefit: 'Prevent related bugs and maintain consistency',
        });
      }
    }
    // Suggest testing based on code changes
    const untested = Object.keys(codeContext.testCoverage.sourceToTest).filter(
      (sourceFile) =>
        !codeContext.testCoverage.sourceToTest[sourceFile] ||
        codeContext.testCoverage.sourceToTest[sourceFile].length === 0,
    );
    if (untested.length > 0) {
      suggestions.push({
        type: 'code',
        suggestion: `Consider adding tests for: ${untested.slice(0, 3).join(', ')}`,
        confidence: 0.6,
        reasoning:
          'These files lack test coverage which could lead to future regressions',
        historicalContext: [`${untested.length} files without tests`],
        estimatedBenefit: 'Improved code reliability and easier maintenance',
      });
    }
    // Suggest refactoring for complex functions
    const complexFunctions = codeContext.activeFunctions
      .filter((func) => func.complexity > 10)
      .sort((a, b) => b.complexity - a.complexity)
      .slice(0, 3);
    if (complexFunctions.length > 0) {
      suggestions.push({
        type: 'optimization',
        suggestion: `Consider refactoring complex functions: ${complexFunctions.map((f) => f.name).join(', ')}`,
        confidence: 0.5,
        reasoning:
          'High complexity functions are harder to maintain and more prone to bugs',
        historicalContext: complexFunctions.map(
          (f) => `${f.name}: complexity ${f.complexity}`,
        ),
        estimatedBenefit: 'Improved code maintainability and reduced bug risk',
        warnings: ['Refactoring complex functions requires thorough testing'],
      });
    }
    return suggestions;
  }
  /**
   * Generate workflow optimization suggestions
   */
  async generateWorkflowSuggestions(currentContext, recentInteractions) {
    const suggestions = [];
    if (!this.config.enableWorkflowOptimization || !recentInteractions) {
      return suggestions;
    }
    // Analyze recent interaction patterns
    const recentCommands = recentInteractions
      .filter((interaction) => interaction.type === 'command')
      .slice(-10);
    // Detect repetitive command sequences
    if (recentCommands.length >= 3) {
      const commandSequences = this.findRepeatedSequences(recentCommands);
      for (const sequence of commandSequences) {
        if (sequence.frequency >= 2) {
          suggestions.push({
            type: 'workflow',
            suggestion: `Create a shortcut or script for the repeated sequence: ${sequence.pattern}`,
            confidence: 0.6,
            reasoning: `You've repeated this command sequence ${sequence.frequency} times recently`,
            historicalContext: [
              `Pattern: ${sequence.pattern}`,
              `Frequency: ${sequence.frequency}`,
            ],
            estimatedBenefit: `Save ~${(sequence.frequency * 30).toFixed(0)} seconds per execution`,
          });
        }
      }
    }
    // Suggest file organization improvements
    const fileInteractions = recentInteractions
      .filter(
        (interaction) => interaction.files && interaction.files.length > 0,
      )
      .flatMap((interaction) => interaction.files || []);
    const fileFrequency = this.calculateFileFrequency(fileInteractions);
    const frequentFiles = Object.entries(fileFrequency)
      .filter(([_, frequency]) => frequency >= 3)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 5);
    if (frequentFiles.length > 0) {
      suggestions.push({
        type: 'workflow',
        suggestion: `Consider adding bookmarks or shortcuts for frequently accessed files: ${frequentFiles.map(([file]) => file).join(', ')}`,
        confidence: 0.4,
        reasoning:
          'You access these files frequently and shortcuts could save time',
        historicalContext: frequentFiles.map(
          ([file, freq]) => `${file}: ${freq} accesses`,
        ),
        estimatedBenefit: 'Faster file navigation and improved productivity',
      });
    }
    return suggestions;
  }
  /**
   * Generate error prevention suggestions
   */
  async generateErrorPreventionSuggestions(currentContext, codeContext) {
    const suggestions = [];
    // Look for common error patterns in interaction history
    const errorInteractions = this.interactionHistory
      .filter((interaction) => !interaction.success)
      .slice(-20);
    if (errorInteractions.length > 0) {
      // Group errors by context similarity
      const errorPatterns = this.groupErrorsByPattern(
        errorInteractions,
        currentContext,
      );
      for (const pattern of errorPatterns) {
        if (pattern.frequency >= 2) {
          suggestions.push({
            type: 'debug',
            suggestion: `Watch out for: ${pattern.commonIssue}`,
            confidence: 0.7,
            reasoning: `You've encountered this type of error ${pattern.frequency} times recently`,
            historicalContext: pattern.examples,
            estimatedBenefit: 'Avoid repeating past mistakes',
            warnings: [`Common error pattern: ${pattern.description}`],
          });
        }
      }
    }
    // Code-specific error prevention
    if (codeContext) {
      // Warn about missing error handling
      const recentChanges = codeContext.recentChanges.filter(
        (change) =>
          change.changeType === 'add' || change.changeType === 'modify',
      );
      if (recentChanges.length > 0) {
        suggestions.push({
          type: 'debug',
          suggestion:
            'Consider adding error handling to recently modified functions',
          confidence: 0.5,
          reasoning:
            'New or modified code often lacks comprehensive error handling',
          historicalContext: recentChanges.map(
            (change) => `${change.filePath}: ${change.description}`,
          ),
          estimatedBenefit: 'Prevent runtime errors and improve robustness',
        });
      }
    }
    return suggestions;
  }
  /**
   * Generate optimization suggestions
   */
  async generateOptimizationSuggestions(currentContext, codeContext) {
    const suggestions = [];
    // Analyze context for optimization opportunities
    if (
      currentContext.toLowerCase().includes('performance') ||
      currentContext.toLowerCase().includes('slow') ||
      currentContext.toLowerCase().includes('optimization')
    ) {
      suggestions.push({
        type: 'optimization',
        suggestion: 'Run performance profiling to identify bottlenecks',
        confidence: 0.6,
        reasoning: 'Context suggests performance concerns',
        historicalContext: ['Performance-related context detected'],
        estimatedBenefit: 'Identify and fix performance bottlenecks',
      });
    }
    // Code-specific optimizations
    if (codeContext) {
      // Suggest dependency cleanup
      const dependencyCount = Object.keys(codeContext.dependencies).length;
      if (dependencyCount > 50) {
        suggestions.push({
          type: 'optimization',
          suggestion: 'Review and cleanup unused dependencies',
          confidence: 0.4,
          reasoning: `Project has ${dependencyCount} dependencies which may include unused ones`,
          historicalContext: [`Total dependencies: ${dependencyCount}`],
          estimatedBenefit: 'Reduced bundle size and faster builds',
        });
      }
      // Suggest function optimization based on usage
      const highUsageFunctions = codeContext.activeFunctions
        .filter((func) => func.usageCount > 10 && func.complexity > 5)
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 3);
      if (highUsageFunctions.length > 0) {
        suggestions.push({
          type: 'optimization',
          suggestion: `Optimize frequently used functions: ${highUsageFunctions.map((f) => f.name).join(', ')}`,
          confidence: 0.5,
          reasoning:
            'These functions are used frequently and could benefit from optimization',
          historicalContext: highUsageFunctions.map(
            (f) => `${f.name}: ${f.usageCount} usages`,
          ),
          estimatedBenefit: 'Improved overall application performance',
        });
      }
    }
    return suggestions;
  }
  /**
   * Track user interaction for pattern learning
   */
  async trackInteraction(interaction) {
    logger.debug('Tracking user interaction', {
      type: interaction.type,
      success: interaction.success,
      duration: interaction.duration,
    });
    // Add to interaction history
    this.interactionHistory.push(interaction);
    // Keep only recent interactions to prevent memory bloat
    if (this.interactionHistory.length > 1000) {
      this.interactionHistory = this.interactionHistory.slice(-800);
    }
    // Learn patterns if enabled
    if (this.config.enablePatternLearning && interaction.success) {
      await this.learnFromInteraction(interaction);
    }
    // Clear suggestion cache as context has changed
    this.suggestionCache.clear();
  }
  /**
   * Learn patterns from successful interactions
   */
  async learnFromInteraction(interaction) {
    try {
      // Extract potential patterns from the interaction
      const patterns = this.extractPatternsFromInteraction(interaction);
      for (const pattern of patterns) {
        const existingPattern = this.learnedPatterns.get(pattern.id);
        if (existingPattern) {
          // Update existing pattern
          existingPattern.frequency += 1;
          existingPattern.lastSeen = interaction.timestamp;
          existingPattern.confidence = Math.min(
            1.0,
            existingPattern.confidence + 0.1,
          );
          // Update success rate if we have feedback
          if (interaction.metadata.suggestionFeedback) {
            const feedback = interaction.metadata.suggestionFeedback;
            existingPattern.userFeedback = feedback;
            existingPattern.successRate =
              feedback === 'positive'
                ? Math.min(1.0, existingPattern.successRate + 0.1)
                : Math.max(0.0, existingPattern.successRate - 0.1);
          }
        } else {
          // Add new pattern if frequency threshold met
          if (pattern.frequency >= this.config.minPatternFrequency) {
            this.learnedPatterns.set(pattern.id, pattern);
            logger.debug(`Learned new pattern: ${pattern.description}`);
          }
        }
      }
      // Cleanup old patterns
      this.cleanupOldPatterns();
    } catch (error) {
      logger.warn('Failed to learn from interaction', {
        error: error.message,
      });
    }
  }
  /**
   * Extract patterns from a single interaction
   */
  extractPatternsFromInteraction(interaction) {
    const patterns = [];
    // Extract command-context patterns
    if (interaction.type === 'command' && interaction.context) {
      const contextWords = interaction.context
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 3);
      const actionWords = interaction.action
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 3);
      if (contextWords.length > 0 && actionWords.length > 0) {
        patterns.push({
          id: `cmd_${contextWords[0]}_${actionWords[0]}`,
          description: `When context contains "${contextWords[0]}", use action "${actionWords[0]}"`,
          triggers: contextWords.slice(0, 3),
          suggestion: interaction.action,
          confidence: 0.5,
          frequency: 1,
          lastSeen: interaction.timestamp,
          successRate: 1.0,
          userFeedback: 'neutral',
        });
      }
    }
    // Extract file-context patterns
    if (interaction.files && interaction.files.length > 0) {
      const fileExtensions = interaction.files
        .map((file) => file.split('.').pop())
        .filter((ext) => ext);
      if (fileExtensions.length > 0) {
        patterns.push({
          id: `file_${fileExtensions[0]}_${interaction.type}`,
          description: `For ${fileExtensions[0]} files, commonly perform ${interaction.type}`,
          triggers: [
            `${fileExtensions[0]} file`,
            `${fileExtensions[0]} development`,
          ],
          suggestion: interaction.action,
          confidence: 0.4,
          frequency: 1,
          lastSeen: interaction.timestamp,
          successRate: 1.0,
          userFeedback: 'neutral',
        });
      }
    }
    return patterns;
  }
  /**
   * Extract patterns from historical sessions
   */
  async extractPatternsFromSessions(sessions) {
    logger.debug(
      `Extracting patterns from ${sessions.length} historical sessions`,
    );
    for (const session of sessions) {
      // Analyze conversation patterns
      if (session.conversationSummary) {
        await this.analyzeConversationPatterns(session);
      }
      // Analyze code context patterns
      if (session.codeContext) {
        await this.analyzeCodePatterns(session.codeContext);
      }
      // Extract workflow patterns from context items
      if (session.contextItems) {
        await this.analyzeWorkflowPatterns(session.contextItems);
      }
    }
    logger.info(`Extracted patterns from sessions`, {
      totalPatterns: this.learnedPatterns.size,
    });
  }
  /**
   * Analyze conversation patterns from sessions
   */
  async analyzeConversationPatterns(session) {
    const conversation = session.conversationSummary.toLowerCase();
    // Look for common task patterns
    const taskPatterns = [
      {
        trigger: ['debug', 'error', 'fix'],
        action: 'investigate logs and error traces',
      },
      {
        trigger: ['test', 'testing'],
        action: 'run test suite and check coverage',
      },
      {
        trigger: ['deploy', 'release'],
        action: 'verify build and run pre-deployment checks',
      },
      {
        trigger: ['refactor', 'cleanup'],
        action: 'analyze code structure and identify improvements',
      },
    ];
    for (const taskPattern of taskPatterns) {
      if (
        taskPattern.trigger.some((trigger) => conversation.includes(trigger))
      ) {
        const patternId = `conversation_${taskPattern.trigger[0]}`;
        const existingPattern = this.learnedPatterns.get(patternId);
        if (existingPattern) {
          existingPattern.frequency += 1;
          existingPattern.lastSeen = session.endTime || session.startTime;
        } else {
          this.learnedPatterns.set(patternId, {
            id: patternId,
            description: `When discussing ${taskPattern.trigger[0]}, commonly ${taskPattern.action}`,
            triggers: taskPattern.trigger,
            suggestion: taskPattern.action,
            confidence: 0.6,
            frequency: 1,
            lastSeen: session.endTime || session.startTime,
            successRate: 0.8,
            userFeedback: 'neutral',
          });
        }
      }
    }
  }
  /**
   * Analyze code patterns from code context
   */
  async analyzeCodePatterns(codeContext) {
    // Analyze function usage patterns
    const functionsByComplexity = codeContext.activeFunctions
      .filter((func) => func.complexity > 5)
      .sort((a, b) => b.complexity - a.complexity);
    if (functionsByComplexity.length > 0) {
      const patternId = 'code_complexity_review';
      const existingPattern = this.learnedPatterns.get(patternId);
      if (existingPattern) {
        existingPattern.frequency += 1;
      } else {
        this.learnedPatterns.set(patternId, {
          id: patternId,
          description:
            'Review complex functions for optimization opportunities',
          triggers: ['complex function', 'high complexity', 'refactor'],
          suggestion:
            'Analyze and potentially refactor complex functions to improve maintainability',
          confidence: 0.5,
          frequency: 1,
          lastSeen: new Date(),
          successRate: 0.7,
          userFeedback: 'neutral',
        });
      }
    }
    // Analyze test coverage patterns
    const uncoveredFiles = Object.keys(
      codeContext.testCoverage.coverage,
    ).filter((file) => codeContext.testCoverage.coverage[file] < 0.5);
    if (uncoveredFiles.length > 0) {
      const patternId = 'code_test_coverage';
      const existingPattern = this.learnedPatterns.get(patternId);
      if (existingPattern) {
        existingPattern.frequency += 1;
      } else {
        this.learnedPatterns.set(patternId, {
          id: patternId,
          description: 'Add tests for files with low coverage',
          triggers: ['test coverage', 'testing', 'unit test'],
          suggestion:
            'Prioritize adding tests for files with low coverage to improve reliability',
          confidence: 0.6,
          frequency: 1,
          lastSeen: new Date(),
          successRate: 0.8,
          userFeedback: 'neutral',
        });
      }
    }
  }
  /**
   * Analyze workflow patterns from context items
   */
  async analyzeWorkflowPatterns(contextItems) {
    // Look for sequences of context items that represent workflows
    const workflowSequences = this.identifyWorkflowSequences(contextItems);
    for (const sequence of workflowSequences) {
      if (sequence.frequency >= 2) {
        const patternId = `workflow_${sequence.id}`;
        const existingPattern = this.learnedPatterns.get(patternId);
        if (existingPattern) {
          existingPattern.frequency += sequence.frequency;
        } else {
          this.learnedPatterns.set(patternId, {
            id: patternId,
            description: sequence.description,
            triggers: sequence.triggers,
            suggestion: sequence.optimizedWorkflow,
            confidence: 0.4,
            frequency: sequence.frequency,
            lastSeen: new Date(),
            successRate: 0.6,
            userFeedback: 'neutral',
          });
        }
      }
    }
  }
  /**
   * Identify workflow sequences from context items
   */
  identifyWorkflowSequences(contextItems) {
    // Simplified workflow identification
    // In production, this would use more sophisticated sequence mining algorithms
    const sequences = [];
    // Look for common code-test-commit patterns
    const codeItems = contextItems.filter((item) => item.type === 'code');
    const testItems = contextItems.filter((item) =>
      item.content.toLowerCase().includes('test'),
    );
    if (codeItems.length > 0 && testItems.length > 0) {
      sequences.push({
        id: 'code_test_commit',
        description: 'Code → Test → Commit workflow',
        triggers: ['coding', 'testing', 'development'],
        optimizedWorkflow:
          'Consider setting up pre-commit hooks to run tests automatically',
        frequency: Math.min(codeItems.length, testItems.length),
      });
    }
    return sequences;
  }
  /**
   * Calculate confidence for a learned pattern
   */
  calculatePatternConfidence(pattern, matchingTriggers, currentContext) {
    let confidence = pattern.confidence;
    // Boost based on trigger match strength
    const triggerMatchRatio = matchingTriggers.length / pattern.triggers.length;
    confidence *= triggerMatchRatio;
    // Boost based on frequency
    const frequencyBoost = Math.min(0.3, pattern.frequency * 0.05);
    confidence += frequencyBoost;
    // Boost based on success rate
    confidence *= pattern.successRate;
    // Penalize based on negative feedback
    if (pattern.userFeedback === 'negative') {
      confidence *= 0.5;
    }
    // Penalize old patterns
    const daysSinceLastSeen =
      (Date.now() - pattern.lastSeen.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastSeen > 30) {
      confidence *= Math.exp(-daysSinceLastSeen / 60); // Exponential decay
    }
    return Math.max(0, Math.min(1, confidence));
  }
  /**
   * Generate cache key for suggestions
   */
  generateCacheKey(currentContext, codeContext) {
    const contextHash = this.simpleHash(currentContext.substring(0, 200));
    const codeHash = codeContext
      ? this.simpleHash(
          JSON.stringify({
            activeFunctions: codeContext.activeFunctions
              .slice(0, 5)
              .map((f) => f.name),
            recentChanges: codeContext.recentChanges
              .slice(0, 3)
              .map((c) => c.filePath),
          }),
        )
      : '0';
    return `${contextHash}_${codeHash}`;
  }
  /**
   * Simple hash function for cache keys
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
  /**
   * Find repeated command sequences
   */
  findRepeatedSequences(commands) {
    const sequences = [];
    const sequenceLength = 3; // Look for 3-command sequences
    if (commands.length < sequenceLength) {
      return sequences;
    }
    const sequenceMap = new Map();
    for (let i = 0; i <= commands.length - sequenceLength; i++) {
      const sequence = commands
        .slice(i, i + sequenceLength)
        .map((cmd) => cmd.action.split(' ')[0]) // First word of action
        .join(' → ');
      sequenceMap.set(sequence, (sequenceMap.get(sequence) || 0) + 1);
    }
    for (const [pattern, frequency] of sequenceMap.entries()) {
      if (frequency >= 2) {
        sequences.push({ pattern, frequency });
      }
    }
    return sequences.sort((a, b) => b.frequency - a.frequency);
  }
  /**
   * Calculate file access frequency
   */
  calculateFileFrequency(fileList) {
    const frequency = {};
    for (const file of fileList) {
      frequency[file] = (frequency[file] || 0) + 1;
    }
    return frequency;
  }
  /**
   * Group errors by similar patterns
   */
  groupErrorsByPattern(errorInteractions, currentContext) {
    const patterns = [];
    // Group by similar error contexts
    const errorGroups = new Map();
    for (const interaction of errorInteractions) {
      const contextWords = interaction.context.toLowerCase().split(/\s+/);
      const keyWords = contextWords
        .filter(
          (word) =>
            word.length > 4 &&
            !['function', 'method', 'variable'].includes(word),
        )
        .slice(0, 2);
      const groupKey = keyWords.join('_') || 'general';
      if (!errorGroups.has(groupKey)) {
        errorGroups.set(groupKey, []);
      }
      errorGroups.get(groupKey).push(interaction);
    }
    // Convert groups to patterns
    for (const [key, interactions] of errorGroups.entries()) {
      if (interactions.length >= 2) {
        patterns.push({
          commonIssue: `Issues with ${key.replace('_', ' ')}`,
          description: `Pattern of errors related to ${key}`,
          frequency: interactions.length,
          examples: interactions.slice(0, 3).map((i) => i.action),
        });
      }
    }
    return patterns.sort((a, b) => b.frequency - a.frequency);
  }
  /**
   * Clean up old or unused patterns
   */
  cleanupOldPatterns() {
    const now = Date.now();
    const maxAge = 90 * 24 * 60 * 60 * 1000; // 90 days
    const minFrequency = this.config.minPatternFrequency;
    for (const [patternId, pattern] of this.learnedPatterns.entries()) {
      const age = now - pattern.lastSeen.getTime();
      if (
        age > maxAge ||
        (pattern.frequency < minFrequency &&
          pattern.userFeedback === 'negative')
      ) {
        this.learnedPatterns.delete(patternId);
        logger.debug(`Cleaned up old pattern: ${pattern.description}`);
      }
    }
    // Limit total patterns to prevent memory bloat
    if (this.learnedPatterns.size > this.config.patternCacheSize) {
      const patterns = Array.from(this.learnedPatterns.entries())
        .sort(([_, a], [__, b]) => b.lastSeen.getTime() - a.lastSeen.getTime())
        .slice(0, this.config.patternCacheSize);
      this.learnedPatterns.clear();
      for (const [id, pattern] of patterns) {
        this.learnedPatterns.set(id, pattern);
      }
    }
  }
  /**
   * Load learned patterns from storage
   */
  async loadLearnedPatterns(projectPath) {
    try {
      // In a full implementation, this would load from persistent storage
      // For now, we'll start with empty patterns
      logger.debug('Loading learned patterns from storage (placeholder)');
    } catch (error) {
      logger.debug('Failed to load learned patterns', {
        error: error.message,
      });
    }
  }
  /**
   * Analyze context for patterns and anomalies
   */
  async analyzeContext(contextItems) {
    const startTime = performance.now();
    logger.debug(`Analyzing context with ${contextItems.length} items`);
    try {
      const patterns = await this.identifyContextPatterns(contextItems);
      const anomalies = await this.detectContextAnomalies(contextItems);
      const optimizations = await this.findContextOptimizations(contextItems);
      const stats = this.calculateContextStats(contextItems);
      const duration = performance.now() - startTime;
      logger.info(`Context analysis completed in ${duration.toFixed(2)}ms`, {
        patterns: patterns.length,
        anomalies: anomalies.length,
        optimizations: optimizations.length,
      });
      return {
        patterns,
        anomalies,
        optimizations,
        stats,
      };
    } catch (error) {
      logger.error('Failed to analyze context', { error });
      throw error;
    }
  }
  /**
   * Identify patterns in context items
   */
  async identifyContextPatterns(contextItems) {
    const patterns = [];
    // Group items by type and analyze patterns
    const byType = this.groupItemsByType(contextItems);
    for (const [type, items] of byType.entries()) {
      if (items.length >= 3) {
        // Look for temporal patterns
        const timeSorted = items.sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
        );
        const timeSpans = this.calculateTimeSpans(timeSorted);
        if (timeSpans.averageSpan > 0) {
          patterns.push({
            name: `${type}_temporal_pattern`,
            description: `Regular ${type} context creation pattern`,
            frequency: items.length,
            matchingItems: items.map((item) => item.id),
            confidence: Math.min(0.9, items.length * 0.1),
          });
        }
        // Look for content similarity patterns
        const similarityGroups = this.findSimilarContent(items);
        for (const group of similarityGroups) {
          if (group.length >= 3) {
            patterns.push({
              name: `${type}_content_similarity`,
              description: `Similar ${type} content pattern`,
              frequency: group.length,
              matchingItems: group.map((item) => item.id),
              confidence: 0.7,
            });
          }
        }
      }
    }
    return patterns.sort((a, b) => b.confidence - a.confidence);
  }
  /**
   * Detect anomalies in context
   */
  async detectContextAnomalies(contextItems) {
    const anomalies = [];
    // Detect outdated items
    const now = Date.now();
    const oldItems = contextItems.filter((item) => {
      const age = now - item.lastAccessed.getTime();
      return age > 7 * 24 * 60 * 60 * 1000; // 7 days
    });
    if (oldItems.length > 0) {
      anomalies.push({
        type: 'outdated',
        description: `${oldItems.length} context items haven't been accessed in over a week`,
        severity: 'medium',
        affectedItems: oldItems.map((item) => item.id),
        resolution: 'Consider removing or archiving old context items',
      });
    }
    // Detect redundant content
    const duplicateGroups = this.findDuplicateContent(contextItems);
    for (const group of duplicateGroups) {
      if (group.length > 1) {
        anomalies.push({
          type: 'redundant',
          description: `${group.length} items contain similar content`,
          severity: 'low',
          affectedItems: group.map((item) => item.id),
          resolution: 'Consider consolidating redundant context items',
        });
      }
    }
    // Detect missing critical context
    const criticalTypes = ['error', 'user-preference'];
    const missingCritical = criticalTypes.filter(
      (type) => !contextItems.some((item) => item.type.toString() === type),
    );
    if (missingCritical.length > 0) {
      anomalies.push({
        type: 'missing',
        description: `Missing critical context types: ${missingCritical.join(', ')}`,
        severity: 'high',
        affectedItems: [],
        resolution:
          'Add missing critical context to improve system performance',
      });
    }
    return anomalies.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }
  /**
   * Find optimization opportunities
   */
  async findContextOptimizations(contextItems) {
    const optimizations = [];
    // Find compression opportunities
    const largeItems = contextItems
      .filter((item) => item.tokenCount > 1000)
      .sort((a, b) => b.tokenCount - a.tokenCount);
    if (largeItems.length > 0) {
      const totalSavings = largeItems.reduce(
        (sum, item) => sum + item.tokenCount * 0.6,
        0,
      );
      optimizations.push({
        type: 'compression',
        description: `Compress ${largeItems.length} large context items`,
        estimatedSavings: totalSavings,
        effort: 'low',
        targetItems: largeItems.map((item) => item.id),
      });
    }
    // Find removal opportunities
    const lowPriorityItems = contextItems
      .filter(
        (item) =>
          item.priority.toString() === 'low' && item.relevanceScore < 0.3,
      )
      .sort((a, b) => a.relevanceScore - b.relevanceScore);
    if (lowPriorityItems.length > 0) {
      const totalSavings = lowPriorityItems.reduce(
        (sum, item) => sum + item.tokenCount,
        0,
      );
      optimizations.push({
        type: 'removal',
        description: `Remove ${lowPriorityItems.length} low-priority items`,
        estimatedSavings: totalSavings,
        effort: 'low',
        targetItems: lowPriorityItems.map((item) => item.id),
      });
    }
    // Find reorganization opportunities
    const untaggedItems = contextItems.filter((item) => item.tags.length === 0);
    if (untaggedItems.length > contextItems.length * 0.3) {
      optimizations.push({
        type: 'reorganization',
        description: 'Add tags to improve context organization',
        estimatedSavings: 0,
        effort: 'medium',
        targetItems: untaggedItems.map((item) => item.id),
      });
    }
    return optimizations.sort(
      (a, b) => b.estimatedSavings - a.estimatedSavings,
    );
  }
  /**
   * Calculate context usage statistics
   */
  calculateContextStats(contextItems) {
    const totalItems = contextItems.length;
    const totalTokens = contextItems.reduce(
      (sum, item) => sum + item.tokenCount,
      0,
    );
    const averageItemSize = totalItems > 0 ? totalTokens / totalItems : 0;
    // Find frequently accessed items (placeholder logic)
    const frequentItems = contextItems
      .sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime())
      .slice(0, 5)
      .map((item) => item.id);
    // Find least recently used items
    const lruItems = contextItems
      .sort((a, b) => a.lastAccessed.getTime() - b.lastAccessed.getTime())
      .slice(0, 5)
      .map((item) => item.id);
    // Calculate utilization rate (simplified)
    const utilizationRate =
      totalItems > 0
        ? contextItems.filter((item) => item.relevanceScore > 0.5).length /
          totalItems
        : 0;
    // Cache hit rate (placeholder)
    const cacheHitRate = 0.75; // Would be calculated from actual cache metrics
    return {
      totalItems,
      totalTokens,
      averageItemSize,
      frequentItems,
      lruItems,
      utilizationRate,
      cacheHitRate,
    };
  }
  /**
   * Group context items by type
   */
  groupItemsByType(contextItems) {
    const groups = new Map();
    for (const item of contextItems) {
      const type = item.type.toString();
      if (!groups.has(type)) {
        groups.set(type, []);
      }
      groups.get(type).push(item);
    }
    return groups;
  }
  /**
   * Calculate time spans between items
   */
  calculateTimeSpans(items) {
    if (items.length < 2) {
      return { averageSpan: 0, spans: [] };
    }
    const spans = [];
    for (let i = 1; i < items.length; i++) {
      const span =
        items[i].timestamp.getTime() - items[i - 1].timestamp.getTime();
      spans.push(span);
    }
    const averageSpan =
      spans.reduce((sum, span) => sum + span, 0) / spans.length;
    return { averageSpan, spans };
  }
  /**
   * Find items with similar content
   */
  findSimilarContent(items) {
    const similarGroups = [];
    const processed = new Set();
    for (const item of items) {
      if (processed.has(item.id)) continue;
      const similarItems = [item];
      processed.add(item.id);
      for (const otherItem of items) {
        if (processed.has(otherItem.id)) continue;
        const similarity = this.calculateContentSimilarity(
          item.content,
          otherItem.content,
        );
        if (similarity > 0.7) {
          similarItems.push(otherItem);
          processed.add(otherItem.id);
        }
      }
      if (similarItems.length > 1) {
        similarGroups.push(similarItems);
      }
    }
    return similarGroups;
  }
  /**
   * Find duplicate content items
   */
  findDuplicateContent(items) {
    const duplicateGroups = [];
    const processed = new Set();
    for (const item of items) {
      if (processed.has(item.id)) continue;
      const duplicates = [item];
      processed.add(item.id);
      for (const otherItem of items) {
        if (processed.has(otherItem.id)) continue;
        const similarity = this.calculateContentSimilarity(
          item.content,
          otherItem.content,
        );
        if (similarity > 0.9) {
          duplicates.push(otherItem);
          processed.add(otherItem.id);
        }
      }
      if (duplicates.length > 1) {
        duplicateGroups.push(duplicates);
      }
    }
    return duplicateGroups;
  }
  /**
   * Calculate content similarity between two strings
   */
  calculateContentSimilarity(content1, content2) {
    if (!content1 || !content2) return 0;
    // Simple word-based similarity (Jaccard similarity)
    const words1 = new Set(
      content1
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 3),
    );
    const words2 = new Set(
      content2
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 3),
    );
    if (words1.size === 0 && words2.size === 0) return 1;
    if (words1.size === 0 || words2.size === 0) return 0;
    const intersection = new Set(
      [...words1].filter((word) => words2.has(word)),
    );
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }
  /**
   * Provide feedback on a suggestion
   */
  async provideFeedback(suggestionId, feedback) {
    logger.debug(`Received feedback for suggestion: ${feedback}`);
    // Update learned patterns based on feedback
    for (const pattern of this.learnedPatterns.values()) {
      if (
        pattern.suggestion.includes(suggestionId) ||
        pattern.id === suggestionId
      ) {
        pattern.userFeedback = feedback;
        // Adjust success rate and confidence based on feedback
        if (feedback === 'positive') {
          pattern.successRate = Math.min(1.0, pattern.successRate + 0.2);
          pattern.confidence = Math.min(1.0, pattern.confidence + 0.1);
        } else if (feedback === 'negative') {
          pattern.successRate = Math.max(0.0, pattern.successRate - 0.2);
          pattern.confidence = Math.max(0.1, pattern.confidence - 0.1);
        }
        logger.debug(`Updated pattern based on feedback`, {
          patternId: pattern.id,
          newSuccessRate: pattern.successRate,
          newConfidence: pattern.confidence,
        });
      }
    }
    // Clear suggestion cache to reflect feedback
    this.suggestionCache.clear();
  }
  /**
   * Get learned patterns for debugging/analysis
   */
  getLearnedPatterns() {
    return Array.from(this.learnedPatterns.values()).sort(
      (a, b) => b.confidence - a.confidence,
    );
  }
  /**
   * Get interaction statistics
   */
  getInteractionStats() {
    const totalInteractions = this.interactionHistory.length;
    const byType = {};
    let totalDuration = 0;
    let successfulInteractions = 0;
    for (const interaction of this.interactionHistory) {
      byType[interaction.type] = (byType[interaction.type] || 0) + 1;
      if (interaction.success) {
        successfulInteractions++;
      }
      if (interaction.duration) {
        totalDuration += interaction.duration;
      }
    }
    return {
      totalInteractions,
      byType,
      successRate:
        totalInteractions > 0 ? successfulInteractions / totalInteractions : 0,
      averageDuration:
        totalInteractions > 0 ? totalDuration / totalInteractions : 0,
    };
  }
  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    // Clear caches if thresholds changed
    if (newConfig.minConfidenceThreshold || newConfig.maxSuggestions) {
      this.suggestionCache.clear();
    }
    logger.info('Suggestion engine configuration updated', {
      config: this.config,
    });
  }
  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }
  /**
   * Clear all caches and reset patterns
   */
  clearAllData() {
    this.learnedPatterns.clear();
    this.suggestionCache.clear();
    this.interactionHistory.splice(0);
    this.workflowPatterns.clear();
    logger.info('All suggestion engine data cleared');
  }
}
/**
 * Create a suggestion engine instance
 */
export function createSuggestionEngine(storage, config) {
  return new SuggestionEngine(storage, config);
}
//# sourceMappingURL=SuggestionEngine.js.map
