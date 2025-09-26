/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Intelligent Commit Message Generator for Version Control Automation
 * Analyzes code changes and generates meaningful, conventional commit messages automatically
 *
 * @author Claude Code - Version Control Automation Agent
 * @version 1.0.0
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { getComponentLogger } from '../utils/logger.js';
import { CommitType } from './types.js';
import type {
  CommitMessage,
  CodeAnalysis,
  ImportChange,
  CommitGenerationOptions,
} from './types.js';

const logger = getComponentLogger('commit-message-generator');

/**
 * Configuration for commit message generation
 */
export interface CommitMessageGeneratorConfig {
  /** Maximum description length */
  maxDescriptionLength: number;
  /** Include scope in messages */
  includeScope: boolean;
  /** Include issue references */
  includeIssueReferences: boolean;
  /** Custom commit type mappings */
  customCommitTypes: Record<string, string>;
  /** File patterns for scope detection */
  scopePatterns: Record<string, string>;
  /** Breaking change keywords */
  breakingChangeKeywords: string[];
  /** Maximum body length */
  maxBodyLength: number;
  /** Include co-authors */
  includeCoAuthors: boolean;
}

/**
 * Default configuration for commit message generator
 */
export const DEFAULT_COMMIT_MESSAGE_CONFIG: CommitMessageGeneratorConfig = {
  maxDescriptionLength: 72,
  includeScope: true,
  includeIssueReferences: true,
  customCommitTypes: {},
  scopePatterns: {
    'src/components/**': 'components',
    'src/services/**': 'services',
    'src/utils/**': 'utils',
    'src/types/**': 'types',
    'tests/**': 'tests',
    'docs/**': 'docs',
    '*.config.*': 'config',
    'package.json': 'deps',
    'README.md': 'docs',
  },
  breakingChangeKeywords: ['BREAKING CHANGE', 'BREAKING', 'breaking change'],
  maxBodyLength: 500,
  includeCoAuthors: true,
};

/**
 * Intelligent commit message generator
 */
export class CommitMessageGenerator {
  private config: CommitMessageGeneratorConfig;

  constructor(config: Partial<CommitMessageGeneratorConfig> = {}) {
    this.config = { ...DEFAULT_COMMIT_MESSAGE_CONFIG, ...config };
    logger.info('CommitMessageGenerator initialized', { config: this.config });
  }

  /**
   * Generate a commit message based on code analysis
   */
  async generateCommitMessage(
    options: CommitGenerationOptions = { includeFileAnalysis: true, includeTestAnalysis: true, includePerformanceImpact: false },
  ): Promise<CommitMessage> {
    try {
      logger.info('Generating commit message', { options });

      const analysis = await this.analyzeChanges(options);
      const commitType = options.overrideType || this.detectCommitType(analysis);
      const scope = this.config.includeScope ? this.extractScope(analysis) : undefined;
      const description = this.generateDescription(commitType, analysis);
      const body = this.generateBody(analysis);
      const isBreakingChange = this.detectBreakingChange(analysis);
      const references = this.extractIssueReferences(analysis);
      const referenceStrings = references.map(ref => `${ref.type}#${ref.id}`);
      const footer = this.generateFooter(isBreakingChange, referenceStrings);

      const commitMessage: CommitMessage = {
        hash: '', // Will be set after commit
        type: commitType,
        scope,
        subject: description,
        body: body || undefined,
        author: this.getCurrentUser(),
        email: this.getCurrentUserEmail(),
        date: new Date(),
        breakingChange: isBreakingChange ? { description, scope } : undefined,
        footers: {},
        references,
      };

      logger.info('Generated commit message', {
        type: commitMessage.type,
        scope: commitMessage.scope,
        subject: commitMessage.subject,
        breakingChange: commitMessage.breakingChange,
      });

      return commitMessage;
    } catch (error) {
      logger.error('Failed to generate commit message', { error });
      throw error;
    }
  }

  /**
   * Analyze code changes
   */
  async analyzeChanges(options: CommitGenerationOptions): Promise<CodeAnalysis> {
    try {
      const modifiedFiles = this.getModifiedFiles();
      const stats = this.getChangeStats(modifiedFiles);

      const analysis: CodeAnalysis = {
        modifiedFiles,
        linesAdded: stats.linesAdded,
        linesRemoved: stats.linesRemoved,
        functionsModified: options.includeFileAnalysis ? await this.analyzeFunctionChanges(modifiedFiles) : [],
        classesModified: options.includeFileAnalysis ? await this.analyzeClassChanges(modifiedFiles) : [],
        importChanges: options.includeFileAnalysis ? await this.analyzeImportChanges(modifiedFiles) : [],
        testFilesAffected: options.includeTestAnalysis ? this.identifyTestFiles(modifiedFiles) : [],
        docChanges: this.identifyDocumentationChanges(modifiedFiles),
        configChanges: this.identifyConfigurationChanges(modifiedFiles),
      };

      logger.debug('Code analysis completed', {
        filesModified: analysis.modifiedFiles.length,
        linesAdded: analysis.linesAdded,
        linesRemoved: analysis.linesRemoved,
        functionsModified: analysis.functionsModified.length,
      });

      return analysis;
    } catch (error) {
      logger.error('Failed to analyze changes', { error });
      throw error;
    }
  }

  /**
   * Detect commit type based on analysis
   */
  detectCommitType(analysis: CodeAnalysis): CommitType {
    // Test files only
    if (analysis.testFilesAffected.length > 0 && this.isOnlyTests(analysis)) {
      return CommitType.TEST;
    }

    // Documentation only
    if (analysis.docChanges.length > 0 && this.isOnlyDocs(analysis)) {
      return CommitType.DOCS;
    }

    // Configuration only
    if (analysis.configChanges.length > 0 && this.isOnlyConfig(analysis)) {
      return CommitType.CHORE;
    }

    // Package.json changes (dependencies)
    if (analysis.modifiedFiles.some(f => f.includes('package.json'))) {
      return CommitType.CHORE;
    }

    // Performance-related changes
    if (this.hasPerformanceChanges(analysis)) {
      return CommitType.PERF;
    }

    // Refactoring (no functional changes)
    if (this.isRefactoring(analysis)) {
      return CommitType.REFACTOR;
    }

    // Bug fixes (based on file patterns and function names)
    if (this.isBugFix(analysis)) {
      return CommitType.FIX;
    }

    // Style changes
    if (this.isStyleChange(analysis)) {
      return CommitType.STYLE;
    }

    // CI/CD changes
    if (this.isCIChange(analysis)) {
      return CommitType.CI;
    }

    // Build changes
    if (this.isBuildChange(analysis)) {
      return CommitType.BUILD;
    }

    // Default to feature
    return CommitType.FEAT;
  }

  /**
   * Extract scope from analysis
   */
  extractScope(analysis: CodeAnalysis): string {
    if (analysis.modifiedFiles.length === 0) return '';

    // Check against scope patterns
    for (const [pattern, scope] of Object.entries(this.config.scopePatterns)) {
      const regexPattern = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
      const regex = new RegExp(regexPattern);

      if (analysis.modifiedFiles.some(file => regex.test(file))) {
        return scope;
      }
    }

    // Extract from common directory patterns
    const commonPaths = analysis.modifiedFiles.map(file => {
      const parts = file.split('/');
      if (parts.length > 1 && parts[0] === 'src') {
        return parts[1];
      }
      return parts[0];
    });

    const mostCommon = this.getMostFrequent(commonPaths);
    return mostCommon || '';
  }

  /**
   * Generate commit description
   */
  generateDescription(type: CommitType, analysis: CodeAnalysis): string {
    let description = '';

    switch (type) {
      case CommitType.FEAT:
        description = this.generateFeatureDescription(analysis);
        break;
      case CommitType.FIX:
        description = this.generateFixDescription(analysis);
        break;
      case CommitType.DOCS:
        description = this.generateDocsDescription(analysis);
        break;
      case CommitType.STYLE:
        description = 'improve code style and formatting';
        break;
      case CommitType.REFACTOR:
        description = this.generateRefactorDescription(analysis);
        break;
      case CommitType.TEST:
        description = this.generateTestDescription(analysis);
        break;
      case CommitType.CHORE:
        description = this.generateChoreDescription(analysis);
        break;
      case CommitType.PERF:
        description = this.generatePerfDescription(analysis);
        break;
      case CommitType.CI:
        description = 'update CI/CD configuration';
        break;
      case CommitType.BUILD:
        description = 'update build configuration';
        break;
      default:
        description = this.generateGenericDescription(analysis);
    }

    // Ensure description doesn't exceed max length
    if (description.length > this.config.maxDescriptionLength) {
      description = description.substring(0, this.config.maxDescriptionLength - 3) + '...';
    }

    return description;
  }

  /**
   * Generate commit body
   */
  generateBody(analysis: CodeAnalysis): string | null {
    const bodyParts: string[] = [];

    // Add function/class changes
    if (analysis.functionsModified.length > 0) {
      bodyParts.push(`Functions modified: ${analysis.functionsModified.slice(0, 5).join(', ')}`);
    }

    if (analysis.classesModified.length > 0) {
      bodyParts.push(`Classes modified: ${analysis.classesModified.slice(0, 3).join(', ')}`);
    }

    // Add import changes
    if (analysis.importChanges.length > 0) {
      const addedImports = analysis.importChanges.filter(c => c.changeType === 'added');
      const removedImports = analysis.importChanges.filter(c => c.changeType === 'removed');

      if (addedImports.length > 0) {
        bodyParts.push(`New dependencies: ${addedImports.slice(0, 3).map(i => i.packageName).join(', ')}`);
      }

      if (removedImports.length > 0) {
        bodyParts.push(`Removed dependencies: ${removedImports.slice(0, 3).map(i => i.packageName).join(', ')}`);
      }
    }

    const body = bodyParts.join('\n\n');
    return body.length > 0 && body.length <= this.config.maxBodyLength ? body : null;
  }

  /**
   * Detect breaking changes
   */
  detectBreakingChange(analysis: CodeAnalysis): boolean {
    // Check for breaking change keywords in diffs
    // This is a simplified implementation - would need actual diff analysis
    const breakingPatterns = [
      /BREAKING CHANGE/i,
      /breaking change/i,
      /remove.*function/i,
      /delete.*method/i,
      /change.*interface/i,
    ];

    // Check file content for breaking change indicators
    return analysis.modifiedFiles.some(file => {
      try {
        const content = execSync(`git diff HEAD~1 HEAD -- "${file}"`, { encoding: 'utf8' });
        return breakingPatterns.some(pattern => pattern.test(content));
      } catch {
        return false;
      }
    });
  }

  /**
   * Extract issue references from commit messages or branch names
   */
  extractIssueReferences(analysis: CodeAnalysis): Array<{ type: string; id: string; url: string }> {
    const references: Array<{ type: string; id: string; url: string }> = [];

    try {
      // Check current branch name for issue references
      const branchName = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      const issuePatterns = [/#(\d+)/, /issue[-_](\d+)/i, /fix[-_](\d+)/i];

      for (const pattern of issuePatterns) {
        const match = branchName.match(pattern);
        if (match) {
          const issueId = match[1];
          references.push({
            type: 'issue',
            id: issueId,
            url: `https://github.com/repo/issues/${issueId}` // Mock URL - would be configurable
          });
        }
      }
    } catch (error) {
      logger.debug('Failed to extract issue references', { error });
    }

    // Remove duplicates based on id
    const uniqueRefs = references.filter((ref, index, arr) =>
      arr.findIndex(r => r.id === ref.id) === index
    );
    return uniqueRefs;
  }

  /**
   * Generate footer with breaking changes and references
   */
  generateFooter(isBreakingChange: boolean, references: string[]): string | null {
    const footerParts: string[] = [];

    if (isBreakingChange) {
      footerParts.push('BREAKING CHANGE: API changes may require updates');
    }

    if (references.length > 0) {
      footerParts.push(`Closes ${references.join(', ')}`);
    }

    return footerParts.length > 0 ? footerParts.join('\n\n') : null;
  }

  /**
   * Extract co-authors from git log
   */
  extractCoAuthors(): string[] | undefined {
    try {
      const coAuthors = execSync('git log -1 --format="%an <%ae>"', { encoding: 'utf8' }).trim();
      return coAuthors ? [coAuthors] : undefined;
    } catch {
      return undefined;
    }
  }

  // Private helper methods

  private getModifiedFiles(): string[] {
    try {
      const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
      return output.trim().split('\n').filter(file => file.length > 0);
    } catch (error) {
      logger.warn('Failed to get modified files, falling back to all changed files', { error });
      try {
        const output = execSync('git diff HEAD~1 --name-only', { encoding: 'utf8' });
        return output.trim().split('\n').filter(file => file.length > 0);
      } catch {
        return [];
      }
    }
  }

  private getChangeStats(files: string[]): { linesAdded: number; linesRemoved: number } {
    try {
      const output = execSync('git diff --cached --numstat', { encoding: 'utf8' });
      const lines = output.trim().split('\n').filter(line => line.length > 0);

      let linesAdded = 0;
      let linesRemoved = 0;

      for (const line of lines) {
        const [added, removed] = line.split('\t');
        if (added !== '-') linesAdded += parseInt(added, 10);
        if (removed !== '-') linesRemoved += parseInt(removed, 10);
      }

      return { linesAdded, linesRemoved };
    } catch {
      return { linesAdded: 0, linesRemoved: 0 };
    }
  }

  private async analyzeFunctionChanges(files: string[]): Promise<string[]> {
    const functions: string[] = [];

    for (const file of files) {
      try {
        const diff = execSync(`git diff --cached -- "${file}"`, { encoding: 'utf8' });
        const functionMatches = diff.match(/[+-]\s*(function\s+\w+|const\s+\w+\s*=|class\s+\w+)/g) || [];
        functions.push(...functionMatches.map(match => match.replace(/[+-]\s*/, '')));
      } catch {
        // Ignore files that can't be diffed
      }
    }

    return [...new Set(functions)];
  }

  private async analyzeClassChanges(files: string[]): Promise<string[]> {
    const classes: string[] = [];

    for (const file of files) {
      try {
        const diff = execSync(`git diff --cached -- "${file}"`, { encoding: 'utf8' });
        const classMatches = diff.match(/[+-]\s*class\s+(\w+)/g) || [];
        classes.push(...classMatches.map(match => match.replace(/[+-]\s*class\s+/, '')));
      } catch {
        // Ignore files that can't be diffed
      }
    }

    return [...new Set(classes)];
  }

  private async analyzeImportChanges(files: string[]): Promise<ImportChange[]> {
    const changes: ImportChange[] = [];

    for (const file of files) {
      try {
        const diff = execSync(`git diff --cached -- "${file}"`, { encoding: 'utf8' });
        const lines = diff.split('\n');

        for (const line of lines) {
          if (line.startsWith('+') && (line.includes('import ') || line.includes('require('))) {
            const packageMatch = line.match(/['"]([^'"]+)['"]/);
            if (packageMatch) {
              changes.push({
                file,
                changeType: 'added',
                importStatement: line.replace(/^\+\s*/, ''),
                packageName: packageMatch[1],
              });
            }
          } else if (line.startsWith('-') && (line.includes('import ') || line.includes('require('))) {
            const packageMatch = line.match(/['"]([^'"]+)['"]/);
            if (packageMatch) {
              changes.push({
                file,
                changeType: 'removed',
                importStatement: line.replace(/^-\s*/, ''),
                packageName: packageMatch[1],
              });
            }
          }
        }
      } catch {
        // Ignore files that can't be diffed
      }
    }

    return changes;
  }

  private identifyTestFiles(files: string[]): string[] {
    const testPatterns = [/\.test\./i, /\.spec\./i, /test/i, /__tests__/i];
    return files.filter(file => testPatterns.some(pattern => pattern.test(file)));
  }

  private identifyDocumentationChanges(files: string[]): string[] {
    const docPatterns = [/\.md$/i, /readme/i, /docs\//i, /\.rst$/i];
    return files.filter(file => docPatterns.some(pattern => pattern.test(file)));
  }

  private identifyConfigurationChanges(files: string[]): string[] {
    const configPatterns = [
      /package\.json$/,
      /\.config\./,
      /\.json$/,
      /\.yaml$/,
      /\.yml$/,
      /dockerfile/i,
      /makefile/i,
    ];
    return files.filter(file => configPatterns.some(pattern => pattern.test(file)));
  }

  private isOnlyTests(analysis: CodeAnalysis): boolean {
    return analysis.testFilesAffected.length === analysis.modifiedFiles.length;
  }

  private isOnlyDocs(analysis: CodeAnalysis): boolean {
    return analysis.docChanges.length === analysis.modifiedFiles.length;
  }

  private isOnlyConfig(analysis: CodeAnalysis): boolean {
    return analysis.configChanges.length === analysis.modifiedFiles.length;
  }

  private hasPerformanceChanges(analysis: CodeAnalysis): boolean {
    const perfKeywords = ['perf', 'performance', 'optimize', 'faster', 'cache', 'lazy'];
    return analysis.functionsModified.some(func =>
      perfKeywords.some(keyword => func.toLowerCase().includes(keyword))
    );
  }

  private isRefactoring(analysis: CodeAnalysis): boolean {
    // Simple heuristic: similar lines added/removed suggests refactoring
    const ratio = Math.min(analysis.linesAdded, analysis.linesRemoved) /
                  Math.max(analysis.linesAdded, analysis.linesRemoved, 1);
    return ratio > 0.7 && analysis.functionsModified.length > 0;
  }

  private isBugFix(analysis: CodeAnalysis): boolean {
    const fixKeywords = ['fix', 'bug', 'error', 'issue', 'resolve', 'patch'];
    return analysis.functionsModified.some(func =>
      fixKeywords.some(keyword => func.toLowerCase().includes(keyword))
    );
  }

  private isStyleChange(analysis: CodeAnalysis): boolean {
    // Check if only formatting/style files changed
    const styleFiles = analysis.modifiedFiles.filter(file =>
      file.includes('.prettier') || file.includes('.eslint') ||
      file.includes('style') || file.includes('.css')
    );
    return styleFiles.length === analysis.modifiedFiles.length;
  }

  private isCIChange(analysis: CodeAnalysis): boolean {
    return analysis.modifiedFiles.some(file =>
      file.includes('.github/workflows') || file.includes('.gitlab-ci') ||
      file.includes('Jenkinsfile') || file.includes('.travis.yml')
    );
  }

  private isBuildChange(analysis: CodeAnalysis): boolean {
    return analysis.modifiedFiles.some(file =>
      file.includes('webpack') || file.includes('rollup') ||
      file.includes('build.') || file.includes('Dockerfile')
    );
  }

  private generateFeatureDescription(analysis: CodeAnalysis): string {
    if (analysis.functionsModified.length > 0) {
      return `add ${analysis.functionsModified[0].toLowerCase()}`;
    }
    return `add new functionality`;
  }

  private generateFixDescription(analysis: CodeAnalysis): string {
    if (analysis.functionsModified.length > 0) {
      return `fix issue in ${analysis.functionsModified[0]}`;
    }
    return `fix bug`;
  }

  private generateDocsDescription(analysis: CodeAnalysis): string {
    return `update documentation`;
  }

  private generateRefactorDescription(analysis: CodeAnalysis): string {
    if (analysis.functionsModified.length > 0) {
      return `refactor ${analysis.functionsModified[0]}`;
    }
    return `refactor code structure`;
  }

  private generateTestDescription(analysis: CodeAnalysis): string {
    return `add tests`;
  }

  private generateChoreDescription(analysis: CodeAnalysis): string {
    if (analysis.modifiedFiles.some(f => f.includes('package.json'))) {
      return `update dependencies`;
    }
    return `update configuration`;
  }

  private generatePerfDescription(analysis: CodeAnalysis): string {
    return `improve performance`;
  }

  private generateGenericDescription(analysis: CodeAnalysis): string {
    return `update ${analysis.modifiedFiles.length} file${analysis.modifiedFiles.length > 1 ? 's' : ''}`;
  }

  private getMostFrequent<T>(array: T[]): T | null {
    if (array.length === 0) return null;

    const frequency: Record<string, number> = {};
    for (const item of array) {
      const key = String(item);
      frequency[key] = (frequency[key] || 0) + 1;
    }

    const mostFrequent = Object.entries(frequency).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0];

    return array.find(item => String(item) === mostFrequent) || null;
  }

  /**
   * Get current Git user name
   */
  private getCurrentUser(): string {
    try {
      return execSync('git config user.name', { encoding: 'utf8' }).trim();
    } catch (error) {
      logger.warn('Failed to get Git user name', { error });
      return 'Unknown User';
    }
  }

  /**
   * Get current Git user email
   */
  private getCurrentUserEmail(): string {
    try {
      return execSync('git config user.email', { encoding: 'utf8' }).trim();
    } catch (error) {
      logger.warn('Failed to get Git user email', { error });
      return 'unknown@example.com';
    }
  }

  /**
   * Format commit message for git commit
   */
  formatCommitMessage(commitMessage: CommitMessage): string {
    let message = commitMessage.type;

    if (commitMessage.scope) {
      message += `(${commitMessage.scope})`;
    }

    if (commitMessage.breakingChange) {
      message += '!';
    }

    message += `: ${commitMessage.subject}`;

    if (commitMessage.body) {
      message += `\n\n${commitMessage.body}`;
    }

    if (commitMessage.footers && Object.keys(commitMessage.footers).length > 0) {
      const footerText = Object.entries(commitMessage.footers)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      message += `\n\n${footerText}`;
    }

    return message;
  }
}