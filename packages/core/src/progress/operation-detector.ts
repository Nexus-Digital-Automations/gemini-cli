/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { OperationType } from '../../../cli/src/ui/types.js';
import type { OperationContext } from '../../../cli/src/ui/types.js';

export interface ToolCallInfo {
  name: string;
  args: Record<string, unknown>;
  description?: string;
}

/**
 * Detects the operation type and creates context based on tool call information
 */
export class OperationDetector {
  /**
   * Analyze a tool call and determine its operation type and context
   */
  static detectOperation(toolCall: ToolCallInfo): OperationContext {
    const operationType = this.detectOperationType(toolCall);
    const description = this.generateDescription(toolCall, operationType);
    const targetFiles = this.extractTargetFiles(toolCall);
    const estimatedDuration = this.estimateDuration(toolCall, operationType);
    const metadata = this.extractMetadata(toolCall, operationType);

    return {
      type: operationType,
      description,
      targetFiles,
      estimatedDuration,
      startTime: new Date(),
      metadata,
    };
  }

  /**
   * Detect the operation type based on tool name and parameters
   */
  private static detectOperationType(toolCall: ToolCallInfo): OperationType {
    const { name, args } = toolCall;

    // File operations
    if (this.isFileOperation(name, args)) {
      return OperationType.FileOperation;
    }

    // Network operations
    if (this.isNetworkOperation(name, args)) {
      return OperationType.NetworkOperation;
    }

    // Code analysis operations
    if (this.isCodeAnalysisOperation(name, args)) {
      return OperationType.CodeAnalysis;
    }

    // Build operations
    if (this.isBuildOperation(name, args)) {
      return OperationType.BuildOperation;
    }

    // Test operations
    if (this.isTestOperation(name, args)) {
      return OperationType.TestOperation;
    }

    // Git operations
    if (this.isGitOperation(name, args)) {
      return OperationType.GitOperation;
    }

    // Package operations
    if (this.isPackageOperation(name, args)) {
      return OperationType.PackageOperation;
    }

    // Search operations
    if (this.isSearchOperation(name, args)) {
      return OperationType.SearchOperation;
    }

    return OperationType.GeneralOperation;
  }

  /**
   * Generate a human-readable description of the operation
   */
  private static generateDescription(
    toolCall: ToolCallInfo,
    _operationType: OperationType,
  ): string {
    const { name, args } = toolCall;

    // Use provided description if available
    if (toolCall.description) {
      return toolCall.description;
    }

    switch (name) {
      case 'Read':
        return `Reading ${this.getFileName(args['file_path'] as string)}`;

      case 'Write':
        return `Writing ${this.getFileName(args['file_path'] as string)}`;

      case 'Edit':
        return `Editing ${this.getFileName(args['file_path'] as string)}`;

      case 'MultiEdit': {
        const editCount = (args['edits'] as unknown[])?.length || 1;
        return `Making ${editCount} edits to ${this.getFileName(args['file_path'] as string)}`;
      }

      case 'Bash': {
        const command = (args['command'] as string)?.split(' ')[0] || 'command';
        return `Running ${command}`;
      }

      case 'Glob':
        return `Finding files matching "${args['pattern']}"`;

      case 'Grep':
        return `Searching for "${args['pattern']}"`;

      case 'WebFetch':
        return `Fetching ${this.getDomain(args['url'] as string)}`;

      case 'WebSearch':
        return `Searching for "${args['query']}"`;

      case 'Task':
        return `Launching ${args['subagent_type']} agent`;

      default:
        return `Executing ${name}`;
    }
  }

  /**
   * Extract target files from tool call arguments
   */
  private static extractTargetFiles(
    toolCall: ToolCallInfo,
  ): string[] | undefined {
    const { name, args } = toolCall;
    const files: string[] = [];

    if (args['file_path'] && typeof args['file_path'] === 'string') {
      files.push(args['file_path']);
    }

    if (args['notebook_path'] && typeof args['notebook_path'] === 'string') {
      files.push(args['notebook_path']);
    }

    if (name === 'Glob' && args['pattern']) {
      // For glob operations, we can't know the files ahead of time
      return undefined;
    }

    if (name === 'Grep' && args['path'] && typeof args['path'] === 'string') {
      files.push(args['path']);
    }

    return files.length > 0 ? files : undefined;
  }

  /**
   * Estimate operation duration based on tool type and parameters
   */
  private static estimateDuration(
    toolCall: ToolCallInfo,
    _operationType: OperationType,
  ): number | undefined {
    const { name, args } = toolCall;

    // Estimates in milliseconds
    switch (name) {
      case 'Read':
        return 1000; // 1 second for reading files

      case 'Write':
      case 'Edit':
        return 2000; // 2 seconds for writing/editing

      case 'MultiEdit': {
        const editCount = (args['edits'] as unknown[])?.length || 1;
        return editCount * 500; // 500ms per edit
      }

      case 'Bash': {
        const command = (args['command'] as string) || '';
        if (
          command.includes('npm install') ||
          command.includes('yarn install')
        ) {
          return 30000; // 30 seconds for package installation
        }
        if (
          command.includes('npm run build') ||
          command.includes('yarn build')
        ) {
          return 15000; // 15 seconds for builds
        }
        if (command.includes('npm test') || command.includes('yarn test')) {
          return 10000; // 10 seconds for tests
        }
        return 5000; // 5 seconds for general bash commands
      }

      case 'WebFetch':
        return 3000; // 3 seconds for web requests

      case 'WebSearch':
        return 5000; // 5 seconds for web searches

      case 'Glob':
      case 'Grep':
        return 2000; // 2 seconds for searches

      case 'Task':
        return 30000; // 30 seconds for agent tasks (could be much longer)

      default:
        return undefined;
    }
  }

  /**
   * Extract additional metadata from tool call
   */
  private static extractMetadata(
    toolCall: ToolCallInfo,
    _operationType: OperationType,
  ): Record<string, unknown> {
    const { name, args } = toolCall;
    const metadata: Record<string, unknown> = {};

    if (name === 'Bash') {
      metadata['command'] = args['command'];
      metadata['hasTimeout'] = 'timeout' in args;
      metadata['runInBackground'] = args['run_in_background'] === true;
    }

    if (name === 'Grep') {
      metadata['pattern'] = args['pattern'];
      metadata['caseInsensitive'] = args['-i'] === true;
      metadata['multiline'] = args['multiline'] === true;
      metadata['outputMode'] = args['output_mode'] || 'files_with_matches';
    }

    if (name === 'WebFetch' || name === 'WebSearch') {
      metadata['url'] = args['url'];
      metadata['query'] = args['query'];
    }

    if (name === 'Task') {
      metadata['subagentType'] = args['subagent_type'];
      metadata['description'] = args['description'];
    }

    return metadata;
  }

  // Helper methods for operation type detection

  private static isFileOperation(
    name: string,
    args: Record<string, unknown>,
  ): boolean {
    const fileOperations = [
      'Read',
      'Write',
      'Edit',
      'MultiEdit',
      'NotebookEdit',
    ];
    return (
      fileOperations.includes(name) ||
      (name === 'Bash' && this.isFileCommand(args['command'] as string))
    );
  }

  private static isNetworkOperation(
    name: string,
    args: Record<string, unknown>,
  ): boolean {
    const networkOperations = ['WebFetch', 'WebSearch'];
    return (
      networkOperations.includes(name) ||
      (name === 'Bash' && this.isNetworkCommand(args['command'] as string))
    );
  }

  private static isCodeAnalysisOperation(
    name: string,
    args: Record<string, unknown>,
  ): boolean {
    if (name === 'Grep' && this.isCodePattern(args['pattern'] as string)) {
      return true;
    }
    return (
      name === 'Bash' && this.isCodeAnalysisCommand(args['command'] as string)
    );
  }

  private static isBuildOperation(
    name: string,
    args: Record<string, unknown>,
  ): boolean {
    return name === 'Bash' && this.isBuildCommand(args['command'] as string);
  }

  private static isTestOperation(
    name: string,
    args: Record<string, unknown>,
  ): boolean {
    return name === 'Bash' && this.isTestCommand(args['command'] as string);
  }

  private static isGitOperation(
    name: string,
    args: Record<string, unknown>,
  ): boolean {
    return name === 'Bash' && this.isGitCommand(args['command'] as string);
  }

  private static isPackageOperation(
    name: string,
    args: Record<string, unknown>,
  ): boolean {
    return name === 'Bash' && this.isPackageCommand(args['command'] as string);
  }

  private static isSearchOperation(
    name: string,
    args: Record<string, unknown>,
  ): boolean {
    return (
      ['Glob', 'Grep'].includes(name) ||
      (name === 'Bash' && this.isSearchCommand(args['command'] as string))
    );
  }

  // Command classification helpers

  private static isFileCommand(command: string): boolean {
    const fileCommands = [
      'cat',
      'head',
      'tail',
      'cp',
      'mv',
      'rm',
      'mkdir',
      'touch',
      'chmod',
      'chown',
    ];
    const firstWord = command.trim().split(' ')[0];
    return fileCommands.includes(firstWord);
  }

  private static isNetworkCommand(command: string): boolean {
    const networkCommands = ['curl', 'wget', 'ping', 'ssh', 'scp', 'rsync'];
    const firstWord = command.trim().split(' ')[0];
    return (
      networkCommands.includes(firstWord) ||
      command.includes('http://') ||
      command.includes('https://')
    );
  }

  private static isCodeAnalysisCommand(command: string): boolean {
    const analysisCommands = [
      'eslint',
      'tsc',
      'mypy',
      'flake8',
      'black',
      'prettier',
      'ruff',
    ];
    return analysisCommands.some((cmd) => command.includes(cmd));
  }

  private static isBuildCommand(command: string): boolean {
    const buildPatterns = [
      'npm run build',
      'yarn build',
      'pnpm build',
      'make',
      'cmake',
      'cargo build',
      'go build',
      'mvn compile',
      'gradle build',
      'docker build',
    ];
    return buildPatterns.some((pattern) => command.includes(pattern));
  }

  private static isTestCommand(command: string): boolean {
    const testPatterns = [
      'npm test',
      'yarn test',
      'pnpm test',
      'jest',
      'mocha',
      'pytest',
      'cargo test',
      'go test',
      'mvn test',
      'gradle test',
    ];
    return testPatterns.some((pattern) => command.includes(pattern));
  }

  private static isGitCommand(command: string): boolean {
    return command.trim().startsWith('git ');
  }

  private static isPackageCommand(command: string): boolean {
    const packagePatterns = [
      'npm install',
      'npm update',
      'npm uninstall',
      'yarn add',
      'yarn remove',
      'yarn upgrade',
      'pnpm add',
      'pnpm remove',
      'pnpm update',
      'pip install',
      'pip uninstall',
      'pip upgrade',
      'cargo install',
      'go get',
      'go mod',
    ];
    return packagePatterns.some((pattern) => command.includes(pattern));
  }

  private static isSearchCommand(command: string): boolean {
    const searchCommands = ['find', 'grep', 'rg', 'ag', 'ack'];
    const firstWord = command.trim().split(' ')[0];
    return searchCommands.includes(firstWord);
  }

  private static isCodePattern(pattern: string): boolean {
    const codePatterns = [
      'function',
      'class',
      'interface',
      'import',
      'export',
      'const',
      'let',
      'var',
      'def',
      'async',
      'await',
    ];
    return codePatterns.some((keyword) => pattern.includes(keyword));
  }

  // Utility methods

  private static getFileName(filePath: string): string {
    if (!filePath || typeof filePath !== 'string') return 'file';
    return filePath.split('/').pop() || filePath;
  }

  private static getDomain(url: string): string {
    if (!url || typeof url !== 'string') return 'website';
    try {
      return new URL(url).hostname;
    } catch {
      return 'website';
    }
  }
}
