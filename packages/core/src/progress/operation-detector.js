/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { OperationType } from './types.js';
/**
 * Detects the operation type and creates context based on tool call information
 */
export class OperationDetector {
  /**
   * Analyze a tool call and determine its operation type and context
   */
  static detectOperation(toolCall) {
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
  static detectOperationType(toolCall) {
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
  static generateDescription(toolCall, _operationType) {
    const { name, args } = toolCall;
    // Use provided description if available
    if (toolCall.description) {
      return toolCall.description;
    }
    switch (name) {
      case 'Read':
        return `Reading ${this.getFileName(args['file_path'])}`;
      case 'Write':
        return `Writing ${this.getFileName(args['file_path'])}`;
      case 'Edit':
        return `Editing ${this.getFileName(args['file_path'])}`;
      case 'MultiEdit': {
        const editCount = args['edits']?.length || 1;
        return `Making ${editCount} edits to ${this.getFileName(args['file_path'])}`;
      }
      case 'Bash': {
        const command = args['command']?.split(' ')[0] || 'command';
        return `Running ${command}`;
      }
      case 'Glob':
        return `Finding files matching "${args['pattern']}"`;
      case 'Grep':
        return `Searching for "${args['pattern']}"`;
      case 'WebFetch':
        return `Fetching ${this.getDomain(args['url'])}`;
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
  static extractTargetFiles(toolCall) {
    const { name, args } = toolCall;
    const files = [];
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
  static estimateDuration(toolCall, _operationType) {
    const { name, args } = toolCall;
    // Estimates in milliseconds
    switch (name) {
      case 'Read':
        return 1000; // 1 second for reading files
      case 'Write':
      case 'Edit':
        return 2000; // 2 seconds for writing/editing
      case 'MultiEdit': {
        const editCount = args['edits']?.length || 1;
        return editCount * 500; // 500ms per edit
      }
      case 'Bash': {
        const command = args['command'] || '';
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
  static extractMetadata(toolCall, _operationType) {
    const { name, args } = toolCall;
    const metadata = {};
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
  static isFileOperation(name, args) {
    const fileOperations = [
      'Read',
      'Write',
      'Edit',
      'MultiEdit',
      'NotebookEdit',
    ];
    return (
      fileOperations.includes(name) ||
      (name === 'Bash' && this.isFileCommand(args['command']))
    );
  }
  static isNetworkOperation(name, args) {
    const networkOperations = ['WebFetch', 'WebSearch'];
    return (
      networkOperations.includes(name) ||
      (name === 'Bash' && this.isNetworkCommand(args['command']))
    );
  }
  static isCodeAnalysisOperation(name, args) {
    if (name === 'Grep' && this.isCodePattern(args['pattern'])) {
      return true;
    }
    return name === 'Bash' && this.isCodeAnalysisCommand(args['command']);
  }
  static isBuildOperation(name, args) {
    return name === 'Bash' && this.isBuildCommand(args['command']);
  }
  static isTestOperation(name, args) {
    return name === 'Bash' && this.isTestCommand(args['command']);
  }
  static isGitOperation(name, args) {
    return name === 'Bash' && this.isGitCommand(args['command']);
  }
  static isPackageOperation(name, args) {
    return name === 'Bash' && this.isPackageCommand(args['command']);
  }
  static isSearchOperation(name, args) {
    return (
      ['Glob', 'Grep'].includes(name) ||
      (name === 'Bash' && this.isSearchCommand(args['command']))
    );
  }
  // Command classification helpers
  static isFileCommand(command) {
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
  static isNetworkCommand(command) {
    const networkCommands = ['curl', 'wget', 'ping', 'ssh', 'scp', 'rsync'];
    const firstWord = command.trim().split(' ')[0];
    return (
      networkCommands.includes(firstWord) ||
      command.includes('http://') ||
      command.includes('https://')
    );
  }
  static isCodeAnalysisCommand(command) {
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
  static isBuildCommand(command) {
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
  static isTestCommand(command) {
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
  static isGitCommand(command) {
    return command.trim().startsWith('git ');
  }
  static isPackageCommand(command) {
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
  static isSearchCommand(command) {
    const searchCommands = ['find', 'grep', 'rg', 'ag', 'ack'];
    const firstWord = command.trim().split(' ')[0];
    return searchCommands.includes(firstWord);
  }
  static isCodePattern(pattern) {
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
  static getFileName(filePath) {
    if (!filePath || typeof filePath !== 'string') return 'file';
    return filePath.split('/').pop() || filePath;
  }
  static getDomain(url) {
    if (!url || typeof url !== 'string') return 'website';
    try {
      return new URL(url).hostname;
    } catch {
      return 'website';
    }
  }
}
//# sourceMappingURL=operation-detector.js.map
