/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ConflictResolutionStrategy,
  ConflictType,
  ConflictCategory,
} from './types.js';
import type {
  MergeConflict,
  VCAutomationConfig,
  ResolutionResult,
  ConflictAnalysis,
  AutoResolutionRule,
  ConflictContext,
  SemanticAnalysis,
  ResolutionReport,
} from './types.js';

/**
 * ConflictResolver - Intelligent merge conflict detection and resolution
 *
 * Core features:
 * - Automatic conflict detection and classification
 * - Intelligent resolution strategy selection
 * - Semantic code analysis for smart merging
 * - Custom resolution rule engine
 * - Comprehensive conflict reporting
 * - Integration with git workflows
 */
export class ConflictResolver {
  private config: VCAutomationConfig['conflictResolution'];
  private workingDir: string;
  private autoResolutionRules: Map<string, AutoResolutionRule>;
  private conflictHistory: Map<string, MergeConflict[]>;

  constructor(config: VCAutomationConfig, workingDir?: string) {
    this.config = config.conflictResolution;
    this.workingDir = workingDir || process.cwd();
    this.autoResolutionRules = new Map();
    this.conflictHistory = new Map();
    this.initializeDefaultRules();
  }

  /**
   * Detect and analyze all merge conflicts in the repository
   */
  async detectConflicts(): Promise<MergeConflict[]> {
    try {
      const status = execSync('git status --porcelain', {
        cwd: this.workingDir,
        encoding: 'utf-8',
      });

      const conflictFiles = status
        .split('\n')
        .filter((line) => line.startsWith('UU ') || line.startsWith('AA '))
        .map((line) => line.substring(3).trim());

      const conflicts: MergeConflict[] = [];

      for (const filePath of conflictFiles) {
        const fileConflicts = await this.parseFileConflicts(filePath);
        conflicts.push(...fileConflicts);
      }

      // Store in history for learning
      const repoId = this.getRepositoryId();
      this.conflictHistory.set(repoId, conflicts);

      return conflicts;
    } catch (error) {
      throw new Error(`Failed to detect conflicts: ${error}`);
    }
  }

  /**
   * Resolve conflicts using intelligent strategies
   */
  async resolveConflicts(
    conflicts: MergeConflict[],
    strategy: ConflictResolutionStrategy = ConflictResolutionStrategy.AUTO_WITH_FALLBACK,
  ): Promise<ResolutionResult[]> {
    const results: ResolutionResult[] = [];

    for (const conflict of conflicts) {
      let result: ResolutionResult;

      switch (strategy) {
        case ConflictResolutionStrategy.AUTO_ONLY:
          result = await this.autoResolveConflict(conflict);
          break;

        case ConflictResolutionStrategy.INTERACTIVE:
          result = await this.interactiveResolveConflict(conflict);
          break;

        case ConflictResolutionStrategy.MANUAL_REVIEW:
          result = await this.prepareManualResolution(conflict);
          break;

        case ConflictResolutionStrategy.AUTO_WITH_FALLBACK:
        default:
          result = await this.autoResolveConflict(conflict);
          if (
            !result.success &&
            result.confidence < this.config.autoResolveThreshold
          ) {
            result = await this.interactiveResolveConflict(conflict);
          }
          break;
      }

      results.push(result);

      // Apply successful resolutions
      if (result.success && result.resolvedContent) {
        await this.applyResolution(conflict, result.resolvedContent);
      }
    }

    return results;
  }

  /**
   * Analyze conflict complexity and suggest optimal resolution strategy
   */
  async analyzeConflicts(
    conflicts: MergeConflict[],
  ): Promise<ConflictAnalysis> {
    const analysis: ConflictAnalysis = {
      totalConflicts: conflicts.length,
      conflictsByType: this.groupConflictsByType(conflicts),
      complexityScore: 0,
      autoResolvableCount: 0,
      highRiskCount: 0,
      estimatedResolutionTime: 0,
      recommendedStrategy: ConflictResolutionStrategy.AUTO_WITH_FALLBACK,
      requiresExpertReview: false,
      semanticComplexity: 0,
      affectedModules: new Set(),
      riskAssessment: {
        dataLoss: 'low',
        functionalBreakage: 'low',
        securityImpact: 'none',
      },
    };

    for (const conflict of conflicts) {
      const complexity = await this.calculateConflictComplexity(conflict);
      analysis.complexityScore += complexity.score;
      analysis.semanticComplexity += complexity.semanticScore;
      analysis.affectedModules.add(conflict.module || 'unknown');

      if (complexity.autoResolvable) {
        analysis.autoResolvableCount++;
      }

      if (complexity.highRisk) {
        analysis.highRiskCount++;
      }

      // Update risk assessment
      if (complexity.risks.dataLoss > analysis.riskAssessment.dataLoss) {
        analysis.riskAssessment.dataLoss = complexity.risks.dataLoss;
      }
      if (
        complexity.risks.functionalBreakage >
        analysis.riskAssessment.functionalBreakage
      ) {
        analysis.riskAssessment.functionalBreakage =
          complexity.risks.functionalBreakage;
      }
      if (
        complexity.risks.securityImpact > analysis.riskAssessment.securityImpact
      ) {
        analysis.riskAssessment.securityImpact =
          complexity.risks.securityImpact;
      }
    }

    // Calculate averages and recommendations
    analysis.complexityScore /= conflicts.length || 1;
    analysis.estimatedResolutionTime = this.estimateResolutionTime(analysis);
    analysis.recommendedStrategy = this.selectOptimalStrategy(analysis);
    analysis.requiresExpertReview = this.requiresExpertReview(analysis);

    return analysis;
  }

  /**
   * Generate comprehensive conflict resolution report
   */
  generateResolutionReport(
    conflicts: MergeConflict[],
    results: ResolutionResult[],
    analysis: ConflictAnalysis,
  ): ResolutionReport {
    const successfulResolutions = results.filter((r) => r.success);
    const failedResolutions = results.filter((r) => !r.success);

    return {
      timestamp: new Date(),
      conflicts: {
        total: conflicts.length,
        resolved: successfulResolutions.length,
        failed: failedResolutions.length,
        byType: analysis.conflictsByType,
      },
      resolution: {
        strategy: analysis.recommendedStrategy,
        autoResolved: results.filter((r) => r.strategy === 'auto').length,
        manualRequired: failedResolutions.length,
        averageConfidence:
          results.reduce((acc, r) => acc + r.confidence, 0) / results.length ||
          0,
        totalTime: results.reduce((acc, r) => acc + (r.resolutionTime || 0), 0),
      },
      analysis,
      recommendations: this.generateRecommendations(analysis, results),
      nextSteps: this.generateNextSteps(failedResolutions),
      metrics: {
        performanceScore: this.calculatePerformanceScore(results),
        accuracyScore: this.calculateAccuracyScore(results),
        efficiencyScore: this.calculateEfficiencyScore(analysis, results),
      },
    };
  }

  /**
   * Parse conflicts from a specific file
   */
  private async parseFileConflicts(filePath: string): Promise<MergeConflict[]> {
    const fullPath = join(this.workingDir, filePath);
    const content = readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');
    const conflicts: MergeConflict[] = [];

    let currentConflict: Partial<MergeConflict> | null = null;
    let conflictIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('<<<<<<<')) {
        currentConflict = {
          id: `${filePath}:${conflictIndex++}`,
          file: filePath,
          startLine: i + 1,
          oursBranch: line.substring(7).trim(),
          oursContent: [],
          theirsContent: [],
          context: this.extractContext(lines, i),
          type: ConflictType.CONTENT,
          severity: 'medium',
        };
      } else if (line.startsWith('=======') && currentConflict) {
        currentConflict.separatorLine = i + 1;
      } else if (line.startsWith('>>>>>>>') && currentConflict) {
        currentConflict.theirsBranch = line.substring(7).trim();
        currentConflict.endLine = i + 1;

        // Classify conflict type and severity
        const conflict = await this.classifyConflict(
          currentConflict as MergeConflict,
        );
        conflicts.push(conflict);
        currentConflict = null;
      } else if (
        currentConflict &&
        Array.isArray(currentConflict.oursContent) &&
        Array.isArray(currentConflict.theirsContent)
      ) {
        if (currentConflict.separatorLine) {
          currentConflict.theirsContent.push(line);
        } else {
          currentConflict.oursContent.push(line);
        }
      }
    }

    return conflicts;
  }

  /**
   * Classify conflict type and determine severity
   */
  private async classifyConflict(
    conflict: MergeConflict,
  ): Promise<MergeConflict> {
    const semantic = await this.analyzeSemantics(conflict);

    // Determine conflict type
    if (this.isImportConflict(conflict)) {
      conflict.type = ConflictType.IMPORTS;
    } else if (this.isFormatOnlyConflict(conflict)) {
      conflict.type = ConflictType.FORMATTING;
    } else if (this.isLogicConflict(conflict)) {
      conflict.type = ConflictType.LOGIC;
    } else if (this.isDataStructureConflict(conflict)) {
      conflict.type = ConflictType.DATA_STRUCTURE;
    } else {
      conflict.type = ConflictType.CONTENT;
    }

    // Determine severity
    conflict.severity = this.calculateSeverity(conflict, semantic);

    return conflict;
  }

  /**
   * Perform semantic analysis on conflict
   */
  private async analyzeSemantics(
    conflict: MergeConflict,
  ): Promise<SemanticAnalysis> {
    const oursCode = Array.isArray(conflict.oursContent)
      ? conflict.oursContent.join('\n')
      : conflict.oursContent || '';
    const theirsCode = Array.isArray(conflict.theirsContent)
      ? conflict.theirsContent.join('\n')
      : conflict.theirsContent || '';

    return {
      syntaxValid: {
        ours: this.validateSyntax(oursCode, conflict.file),
        theirs: this.validateSyntax(theirsCode, conflict.file),
      },
      semanticSimilarity: this.calculateSemanticSimilarity(
        oursCode,
        theirsCode,
      ),
      functionalEquivalence: this.checkFunctionalEquivalence(
        oursCode,
        theirsCode,
      ),
      riskFactors: this.identifyRiskFactors(conflict),
      complexity: this.calculateCodeComplexity(oursCode, theirsCode),
      dependencies: this.analyzeDependencies(conflict),
    };
  }

  /**
   * Automatically resolve a conflict using AI and pattern matching
   */
  private async autoResolveConflict(
    conflict: MergeConflict,
  ): Promise<ResolutionResult> {
    const startTime = Date.now();

    try {
      // Check for auto-resolution rules
      const rule = this.findMatchingRule(conflict);
      if (rule) {
        const resolution = await this.applyResolutionRule(conflict, rule);
        return {
          conflictId: conflict.id || 'unknown',
          success: true,
          strategy: 'auto',
          resolvedContent: resolution.content,
          confidence: resolution.confidence,
          reasoning: resolution.reasoning,
          resolutionTime: Date.now() - startTime,
        };
      }

      // Perform semantic resolution
      const semanticResult = await this.semanticResolution(conflict);
      if (semanticResult.confidence >= this.config.autoResolveThreshold) {
        return {
          conflictId: conflict.id || 'unknown',
          success: true,
          strategy: 'semantic',
          resolvedContent: semanticResult.content,
          confidence: semanticResult.confidence,
          reasoning: semanticResult.reasoning,
          resolutionTime: Date.now() - startTime,
        };
      }

      // Fall back to pattern-based resolution
      const patternResult = await this.patternBasedResolution(conflict);
      return {
        conflictId: conflict.id || 'unknown',
        success: patternResult.confidence >= this.config.autoResolveThreshold,
        strategy: 'pattern',
        resolvedContent: patternResult.content,
        confidence: patternResult.confidence,
        reasoning: patternResult.reasoning,
        resolutionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        conflictId: conflict.id || 'unknown',
        success: false,
        strategy: 'auto',
        confidence: 0,
        reasoning: `Auto-resolution failed: ${error}`,
        resolutionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Interactive conflict resolution with user guidance
   */
  private async interactiveResolveConflict(
    conflict: MergeConflict,
  ): Promise<ResolutionResult> {
    // In a real implementation, this would provide interactive prompts
    // For now, return a structured response for manual handling
    return {
      conflictId: conflict.id || 'unknown',
      success: false,
      strategy: 'interactive',
      confidence: 0,
      reasoning: 'Interactive resolution required - presenting options to user',
      suggestions: [
        'Accept incoming changes',
        'Keep current changes',
        'Merge both changes',
        'Custom resolution',
      ],
      resolutionTime: 0,
    };
  }

  /**
   * Prepare manual resolution with detailed analysis
   */
  private async prepareManualResolution(
    conflict: MergeConflict,
  ): Promise<ResolutionResult> {
    const analysis = await this.analyzeSemantics(conflict);

    return {
      conflictId: conflict.id || 'unknown',
      success: false,
      strategy: 'manual',
      confidence: 0,
      reasoning: 'Manual review required due to complexity or risk',
      analysis: {
        conflictType: conflict.type,
        severity: conflict.severity,
        riskFactors: analysis.riskFactors,
        recommendations: this.generateManualResolutionGuidance(
          conflict,
          analysis,
        ),
      },
      resolutionTime: 0,
    };
  }

  /**
   * Apply resolved content to file
   */
  private async applyResolution(
    conflict: MergeConflict,
    resolvedContent: string,
  ): Promise<void> {
    const fullPath = join(this.workingDir, conflict.file);
    const content = readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');

    // Replace conflict markers with resolved content
    const beforeConflict = lines.slice(0, conflict.startLine - 1);
    const afterConflict = lines.slice(conflict.endLine);
    const resolvedLines = resolvedContent.split('\n');

    const newContent = [
      ...beforeConflict,
      ...resolvedLines,
      ...afterConflict,
    ].join('\n');

    writeFileSync(fullPath, newContent, 'utf-8');
  }

  /**
   * Initialize default auto-resolution rules
   */
  private initializeDefaultRules(): void {
    // Import conflict resolution
    this.autoResolutionRules.set('import-merge', {
      id: 'import-merge',
      name: 'Import Statement Merge',
      pattern: /^(import|from|require)/,
      conflictTypes: [ConflictType.IMPORTS],
      confidence: 0.9,
      resolver: (conflict) => this.mergeImportStatements(conflict),
    });

    // Formatting conflicts
    this.autoResolutionRules.set('formatting-fix', {
      id: 'formatting-fix',
      name: 'Formatting Normalization',
      pattern: /^\s*$/,
      conflictTypes: [ConflictType.FORMATTING],
      confidence: 0.95,
      resolver: (conflict) => this.normalizeFormatting(conflict),
    });

    // Version updates
    this.autoResolutionRules.set('version-latest', {
      id: 'version-latest',
      name: 'Take Latest Version',
      pattern: /"version":\s*"/,
      conflictTypes: [ConflictType.CONTENT],
      confidence: 0.8,
      resolver: (conflict) => this.selectLatestVersion(conflict),
    });
  }

  /**
   * Helper methods for conflict analysis and resolution
   */
  private extractContext(
    lines: string[],
    conflictLine: number,
  ): ConflictContext {
    const contextSize = 5;
    const start = Math.max(0, conflictLine - contextSize);
    const end = Math.min(lines.length, conflictLine + contextSize);

    return {
      beforeLines: lines.slice(start, conflictLine),
      afterLines: lines.slice(conflictLine + 1, end),
      function: this.findEnclosingFunction(lines, conflictLine),
      module: this.findModuleName(lines),
      functionName: this.findEnclosingFunction(lines, conflictLine),
      className: undefined,
      fileType: 'text',
      contextLines: lines.slice(start, end),
      category: ConflictCategory.CODE_LOGIC,
    } as ConflictContext;
  }

  private findEnclosingFunction(
    lines: string[],
    line: number,
  ): string | undefined {
    for (let i = line; i >= 0; i--) {
      const match = lines[i].match(/^\s*(function|class|method|def)\s+(\w+)/);
      if (match) return match[2];
    }
    return undefined;
  }

  private findModuleName(lines: string[]): string | undefined {
    for (const line of lines.slice(0, 20)) {
      const match = line.match(/module\.exports|export|package\s+(\w+)/);
      if (match) return match[1];
    }
    return undefined;
  }

  private getRepositoryId(): string {
    try {
      return execSync('git rev-parse --show-toplevel', {
        cwd: this.workingDir,
        encoding: 'utf-8',
      }).trim();
    } catch {
      return this.workingDir;
    }
  }

  // Additional helper methods would continue here...
  private groupConflictsByType(
    conflicts: MergeConflict[],
  ): Record<string, number> {
    return conflicts.reduce(
      (acc, conflict) => {
        const type = conflict.type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private async calculateConflictComplexity(
    conflict: MergeConflict,
  ): Promise<any> {
    // Implementation for complexity calculation
    return {
      score: 1,
      semanticScore: 1,
      autoResolvable: conflict.type === ConflictType.FORMATTING,
      highRisk: conflict.severity === 'high',
      risks: {
        dataLoss: 'low' as const,
        functionalBreakage: 'low' as const,
        securityImpact: 'none' as const,
      },
    };
  }

  private estimateResolutionTime(analysis: ConflictAnalysis): number {
    return analysis.totalConflicts * 5 + analysis.complexityScore * 10;
  }

  private selectOptimalStrategy(
    analysis: ConflictAnalysis,
  ): ConflictResolutionStrategy {
    if (analysis.autoResolvableCount / analysis.totalConflicts > 0.8) {
      return ConflictResolutionStrategy.AUTO_ONLY;
    }
    if (analysis.requiresExpertReview) {
      return ConflictResolutionStrategy.MANUAL_REVIEW;
    }
    return ConflictResolutionStrategy.AUTO_WITH_FALLBACK;
  }

  private requiresExpertReview(analysis: ConflictAnalysis): boolean {
    return (
      analysis.highRiskCount > 0 ||
      analysis.complexityScore > 8 ||
      analysis.riskAssessment.dataLoss === 'high' ||
      analysis.riskAssessment.securityImpact !== 'none'
    );
  }

  private generateRecommendations(
    analysis: ConflictAnalysis,
    _results: ResolutionResult[],
  ): string[] {
    const recommendations: string[] = [];

    if (analysis.autoResolvableCount > 0) {
      recommendations.push(
        `${analysis.autoResolvableCount} conflicts can be auto-resolved safely`,
      );
    }

    if (analysis.highRiskCount > 0) {
      recommendations.push(
        `${analysis.highRiskCount} high-risk conflicts require expert review`,
      );
    }

    return recommendations;
  }

  private generateNextSteps(failedResolutions: ResolutionResult[]): string[] {
    const steps: string[] = [];

    if (failedResolutions.length > 0) {
      steps.push(
        `Review ${failedResolutions.length} unresolved conflicts manually`,
      );
      steps.push('Run tests after resolution to verify functionality');
    }

    return steps;
  }

  private calculatePerformanceScore(results: ResolutionResult[]): number {
    const totalTime = results.reduce(
      (acc, r) => acc + (r.resolutionTime || 0),
      0,
    );
    const avgTime = totalTime / results.length || 0;
    return Math.max(0, 100 - avgTime / 1000); // Score based on average resolution time
  }

  private calculateAccuracyScore(results: ResolutionResult[]): number {
    const successful = results.filter((r) => r.success).length;
    return (successful / results.length) * 100 || 0;
  }

  private calculateEfficiencyScore(
    analysis: ConflictAnalysis,
    results: ResolutionResult[],
  ): number {
    const autoResolved = results.filter(
      (r) => r.success && r.strategy === 'auto',
    ).length;
    return (autoResolved / analysis.totalConflicts) * 100 || 0;
  }

  // Conflict type detection methods
  private isImportConflict(conflict: MergeConflict): boolean {
    const oursContent = Array.isArray(conflict.oursContent)
      ? conflict.oursContent
      : conflict.oursContent
        ? [conflict.oursContent]
        : [];
    const theirsContent = Array.isArray(conflict.theirsContent)
      ? conflict.theirsContent
      : conflict.theirsContent
        ? [conflict.theirsContent]
        : [];
    const allContent = [...oursContent, ...theirsContent].join('\n');
    return /^(import|from|require|#include)/m.test(allContent);
  }

  private isFormatOnlyConflict(conflict: MergeConflict): boolean {
    const oursContent = Array.isArray(conflict.oursContent)
      ? conflict.oursContent.join('')
      : conflict.oursContent || '';
    const theirsContent = Array.isArray(conflict.theirsContent)
      ? conflict.theirsContent.join('')
      : conflict.theirsContent || '';
    const oursNormalized = oursContent.replace(/\s/g, '');
    const theirsNormalized = theirsContent.replace(/\s/g, '');
    return oursNormalized === theirsNormalized;
  }

  private isLogicConflict(conflict: MergeConflict): boolean {
    const logicPatterns =
      /\b(if|else|for|while|switch|case|function|class|method)\b/;
    const oursContent = Array.isArray(conflict.oursContent)
      ? conflict.oursContent
      : conflict.oursContent
        ? [conflict.oursContent]
        : [];
    const theirsContent = Array.isArray(conflict.theirsContent)
      ? conflict.theirsContent
      : conflict.theirsContent
        ? [conflict.theirsContent]
        : [];
    const allContent = [...oursContent, ...theirsContent].join('\n');
    return logicPatterns.test(allContent);
  }

  private isDataStructureConflict(conflict: MergeConflict): boolean {
    const structurePatterns = /\b(interface|type|struct|class|schema|model)\b/;
    const oursContent = Array.isArray(conflict.oursContent)
      ? conflict.oursContent
      : conflict.oursContent
        ? [conflict.oursContent]
        : [];
    const theirsContent = Array.isArray(conflict.theirsContent)
      ? conflict.theirsContent
      : conflict.theirsContent
        ? [conflict.theirsContent]
        : [];
    const allContent = [...oursContent, ...theirsContent].join('\n');
    return structurePatterns.test(allContent);
  }

  private calculateSeverity(
    conflict: MergeConflict,
    semantic: SemanticAnalysis,
  ): 'low' | 'medium' | 'high' {
    if (conflict.type === ConflictType.FORMATTING) return 'low';
    if (semantic.riskFactors.length > 2) return 'high';
    if (conflict.type === ConflictType.LOGIC) return 'medium';
    return 'low';
  }

  // Semantic analysis helper methods
  private validateSyntax(code: string, filePath: string): boolean {
    // Basic syntax validation - in real implementation would use language-specific parsers
    try {
      if (filePath.endsWith('.json')) {
        JSON.parse(code);
        return true;
      }
      return !code.includes('undefined') && !code.includes('SyntaxError');
    } catch {
      return false;
    }
  }

  private calculateSemanticSimilarity(code1: string, code2: string): number {
    // Simple similarity calculation - real implementation would use AST comparison
    const words1 = code1.toLowerCase().split(/\W+/);
    const words2 = code2.toLowerCase().split(/\W+/);
    const common = words1.filter((w) => words2.includes(w)).length;
    const total = Math.max(words1.length, words2.length);
    return common / total;
  }

  private checkFunctionalEquivalence(code1: string, code2: string): boolean {
    // Basic equivalence check - real implementation would use semantic analysis
    const normalized1 = code1.replace(/\s+/g, ' ').trim();
    const normalized2 = code2.replace(/\s+/g, ' ').trim();
    return (
      normalized1 === normalized2 ||
      this.calculateSemanticSimilarity(code1, code2) > 0.9
    );
  }

  private identifyRiskFactors(conflict: MergeConflict): string[] {
    const risks: string[] = [];
    const oursContent = Array.isArray(conflict.oursContent)
      ? conflict.oursContent
      : conflict.oursContent
        ? [conflict.oursContent]
        : [];
    const theirsContent = Array.isArray(conflict.theirsContent)
      ? conflict.theirsContent
      : conflict.theirsContent
        ? [conflict.theirsContent]
        : [];
    const allContent = [...oursContent, ...theirsContent].join('\n');

    if (/delete|remove|drop/i.test(allContent)) risks.push('data_deletion');
    if (/password|key|secret|token/i.test(allContent))
      risks.push('security_sensitive');
    if (/api|endpoint|url/i.test(allContent)) risks.push('api_breaking');
    if (/database|sql|query/i.test(allContent)) risks.push('data_access');

    return risks;
  }

  private calculateCodeComplexity(code1: string, code2: string): number {
    // Basic complexity calculation based on control structures
    const complexityPatterns = /\b(if|else|for|while|switch|case|try|catch)\b/g;
    const complexity1 = (code1.match(complexityPatterns) || []).length;
    const complexity2 = (code2.match(complexityPatterns) || []).length;
    return Math.max(complexity1, complexity2);
  }

  private analyzeDependencies(conflict: MergeConflict): string[] {
    // Extract potential dependencies from conflict content
    const deps: string[] = [];
    const oursContent = Array.isArray(conflict.oursContent)
      ? conflict.oursContent
      : conflict.oursContent
        ? [conflict.oursContent]
        : [];
    const theirsContent = Array.isArray(conflict.theirsContent)
      ? conflict.theirsContent
      : conflict.theirsContent
        ? [conflict.theirsContent]
        : [];
    const allContent = [...oursContent, ...theirsContent].join('\n');

    const importMatches = allContent.match(
      /(?:import|require|from)\s+['"`]([^'"`]+)['"`]/g,
    );
    if (importMatches) {
      deps.push(
        ...importMatches.map((m) => m.replace(/.*['"`]([^'"`]+)['"`].*/, '$1')),
      );
    }

    return deps;
  }

  // Resolution implementation methods
  private findMatchingRule(
    conflict: MergeConflict,
  ): AutoResolutionRule | undefined {
    for (const rule of this.autoResolutionRules.values()) {
      if (conflict.type && rule.conflictTypes.includes(conflict.type)) {
        const oursContent = Array.isArray(conflict.oursContent)
          ? conflict.oursContent
          : conflict.oursContent
            ? [conflict.oursContent]
            : [];
        const theirsContent = Array.isArray(conflict.theirsContent)
          ? conflict.theirsContent
          : conflict.theirsContent
            ? [conflict.theirsContent]
            : [];
        const allContent = [...oursContent, ...theirsContent].join('\n');
        if (rule.pattern.test(allContent)) {
          return rule;
        }
      }
    }
    return undefined;
  }

  private async applyResolutionRule(
    conflict: MergeConflict,
    rule: AutoResolutionRule,
  ): Promise<any> {
    return rule.resolver(conflict);
  }

  private async semanticResolution(conflict: MergeConflict): Promise<any> {
    const semantic = await this.analyzeSemantics(conflict);

    if (semantic.functionalEquivalence) {
      const oursContent = Array.isArray(conflict.oursContent)
        ? conflict.oursContent.join('\n')
        : conflict.oursContent || '';
      return {
        content: oursContent,
        confidence: 0.9,
        reasoning: 'Functionally equivalent code - keeping current version',
      };
    }

    return {
      content: '',
      confidence: 0.3,
      reasoning: 'No clear semantic resolution found',
    };
  }

  private async patternBasedResolution(conflict: MergeConflict): Promise<any> {
    // Pattern-based resolution logic
    if (conflict.type === ConflictType.FORMATTING) {
      return {
        content: this.normalizeFormatting(conflict).content,
        confidence: 0.95,
        reasoning: 'Formatting conflict resolved by normalization',
      };
    }

    return {
      content: '',
      confidence: 0.2,
      reasoning: 'No suitable pattern found for resolution',
    };
  }

  private generateManualResolutionGuidance(
    conflict: MergeConflict,
    analysis: SemanticAnalysis,
  ): string[] {
    const guidance: string[] = [];

    guidance.push(`Conflict type: ${conflict.type}`);
    guidance.push(`Severity: ${conflict.severity}`);

    if (analysis.riskFactors.length > 0) {
      guidance.push(`Risk factors: ${analysis.riskFactors.join(', ')}`);
    }

    if (!analysis.syntaxValid.ours && !analysis.syntaxValid.theirs) {
      guidance.push('WARNING: Both versions have syntax errors');
    } else if (!analysis.syntaxValid.ours) {
      guidance.push(
        'RECOMMENDATION: Use theirs version (ours has syntax errors)',
      );
    } else if (!analysis.syntaxValid.theirs) {
      guidance.push(
        'RECOMMENDATION: Use ours version (theirs has syntax errors)',
      );
    }

    return guidance;
  }

  // Auto-resolution rule implementations
  private mergeImportStatements(conflict: MergeConflict): {
    content: string;
    confidence: number;
    reasoning: string;
  } {
    const oursContent = Array.isArray(conflict.oursContent)
      ? conflict.oursContent
      : conflict.oursContent
        ? [conflict.oursContent]
        : [];
    const theirsContent = Array.isArray(conflict.theirsContent)
      ? conflict.theirsContent
      : conflict.theirsContent
        ? [conflict.theirsContent]
        : [];

    const allImports = [...oursContent, ...theirsContent]
      .filter((line) => line.trim())
      .filter((line, index, arr) => arr.indexOf(line) === index) // Remove duplicates
      .sort();

    return {
      content: allImports.join('\n'),
      confidence: 0.9,
      reasoning: 'Merged and deduplicated import statements',
    };
  }

  private normalizeFormatting(conflict: MergeConflict): {
    content: string;
    confidence: number;
    reasoning: string;
  } {
    const oursContent = Array.isArray(conflict.oursContent)
      ? conflict.oursContent
      : conflict.oursContent
        ? [conflict.oursContent]
        : [];
    const theirsContent = Array.isArray(conflict.theirsContent)
      ? conflict.theirsContent
      : conflict.theirsContent
        ? [conflict.theirsContent]
        : [];

    // Choose the version with better formatting (more consistent indentation)
    const oursFormatScore = this.calculateFormattingScore(oursContent);
    const theirsFormatScore = this.calculateFormattingScore(theirsContent);

    const content =
      oursFormatScore >= theirsFormatScore
        ? oursContent.join('\n')
        : theirsContent.join('\n');

    return {
      content,
      confidence: 0.95,
      reasoning: `Selected version with better formatting (score: ${Math.max(oursFormatScore, theirsFormatScore)})`,
    };
  }

  private selectLatestVersion(conflict: MergeConflict): {
    content: string;
    confidence: number;
    reasoning: string;
  } {
    const oursContent = Array.isArray(conflict.oursContent)
      ? conflict.oursContent.join('\n')
      : conflict.oursContent || '';
    const theirsContent = Array.isArray(conflict.theirsContent)
      ? conflict.theirsContent.join('\n')
      : conflict.theirsContent || '';

    // Extract version numbers and select the latest
    const oursVersion = this.extractVersion(oursContent);
    const theirsVersion = this.extractVersion(theirsContent);

    if (
      oursVersion &&
      theirsVersion &&
      this.compareVersions(oursVersion, theirsVersion) < 0
    ) {
      return {
        content: theirsContent,
        confidence: 0.8,
        reasoning: `Selected newer version: ${theirsVersion} > ${oursVersion}`,
      };
    }

    return {
      content: oursContent,
      confidence: 0.8,
      reasoning: oursVersion
        ? `Keeping current version: ${oursVersion}`
        : 'Keeping current version',
    };
  }

  private calculateFormattingScore(lines: string[]): number {
    let score = 0;
    const indentPattern = /^(\s*)/;

    for (const line of lines) {
      const match = line.match(indentPattern);
      if (match && match[1].length % 2 === 0) {
        score += 1; // Consistent 2-space indentation
      }
      if (line.trim() && !line.endsWith(' ')) {
        score += 1; // No trailing spaces
      }
    }

    return score / lines.length;
  }

  private extractVersion(content: string): string | null {
    const versionMatch = content.match(/"version":\s*"([^"]+)"/);
    return versionMatch ? versionMatch[1] : null;
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    }

    return 0;
  }
}
