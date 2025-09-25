/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
/**
 * Hook that provides contextual loading phrases based on the current operation
 */
export const useContextualPhrases = (operation) => {
  const phrase = useMemo(() => {
    if (!operation) {
      return getGenericPhrase();
    }
    // Get operation-specific phrase
    const specificPhrase = getOperationSpecificPhrase(operation);
    if (specificPhrase) {
      return { message: specificPhrase, isSpecific: true };
    }
    // Fall back to operation type phrases
    const typePhrase = getOperationTypePhrase(operation.context.type);
    if (typePhrase) {
      return { message: typePhrase, isSpecific: true };
    }
    // Ultimate fallback to generic phrase
    return getGenericPhrase();
  }, [operation]);
  return phrase;
};
/**
 * Get a specific phrase based on the current operation details
 */
function getOperationSpecificPhrase(operation) {
  const { context, steps, currentStepIndex } = operation;
  const currentStep = steps[currentStepIndex];
  // Current step specific messages
  if (currentStep) {
    const stepPhrase = getStepSpecificPhrase(currentStep.description, context);
    if (stepPhrase) return stepPhrase;
  }
  // File operation specific messages
  if (context.targetFiles && context.targetFiles.length > 0) {
    const fileName = getFileName(context.targetFiles[0]);
    switch (context.type) {
      case 'file_operation':
        return `Working on ${fileName}...`;
      case 'code_analysis':
        return `Analyzing ${fileName}...`;
      default:
        break;
    }
  }
  // Multi-file operations
  if (context.targetFiles && context.targetFiles.length > 1) {
    return `Processing ${context.targetFiles.length} files...`;
  }
  // Progress-based messages
  if (operation.overallProgress > 0) {
    const remaining = 100 - operation.overallProgress;
    if (remaining <= 10) {
      return 'Almost finished...';
    } else if (remaining <= 25) {
      return 'Nearly there...';
    } else if (remaining <= 50) {
      return 'Making good progress...';
    }
  }
  return null;
}
/**
 * Get step-specific phrases based on step description and context
 */
function getStepSpecificPhrase(stepDescription, _context) {
  const lower = stepDescription.toLowerCase();
  // File operations
  if (lower.includes('reading') || lower.includes('read')) {
    return `Reading file contents...`;
  }
  if (lower.includes('writing') || lower.includes('write')) {
    return `Writing changes to disk...`;
  }
  if (lower.includes('editing') || lower.includes('edit')) {
    return `Applying edits...`;
  }
  // Network operations
  if (lower.includes('connecting') || lower.includes('connect')) {
    return `Establishing connection...`;
  }
  if (lower.includes('fetching') || lower.includes('fetch')) {
    return `Downloading content...`;
  }
  if (lower.includes('uploading') || lower.includes('upload')) {
    return `Uploading data...`;
  }
  // Build/compile operations
  if (lower.includes('compiling') || lower.includes('compile')) {
    return `Compiling source code...`;
  }
  if (lower.includes('building') || lower.includes('build')) {
    return `Building project...`;
  }
  if (lower.includes('bundling') || lower.includes('bundle')) {
    return `Creating bundles...`;
  }
  // Package operations
  if (lower.includes('downloading packages') || lower.includes('download')) {
    return `Downloading dependencies...`;
  }
  if (lower.includes('installing') || lower.includes('install')) {
    return `Installing packages...`;
  }
  // Test operations
  if (lower.includes('running tests') || lower.includes('testing')) {
    return `Executing test suite...`;
  }
  if (lower.includes('discovering') && lower.includes('test')) {
    return `Finding test files...`;
  }
  // Git operations
  if (lower.includes('commit')) {
    return `Creating commit...`;
  }
  if (lower.includes('push')) {
    return `Pushing to remote...`;
  }
  if (lower.includes('pull')) {
    return `Pulling latest changes...`;
  }
  // Analysis operations
  if (lower.includes('analyzing') || lower.includes('analysis')) {
    return `Running code analysis...`;
  }
  if (lower.includes('linting') || lower.includes('lint')) {
    return `Checking code style...`;
  }
  if (lower.includes('type check') || lower.includes('typecheck')) {
    return `Validating type definitions...`;
  }
  // Search operations
  if (lower.includes('searching') || lower.includes('search')) {
    return `Searching through files...`;
  }
  if (lower.includes('scanning') || lower.includes('scan')) {
    return `Scanning directory structure...`;
  }
  return null;
}
/**
 * Get phrases based on operation type
 */
function getOperationTypePhrase(operationType) {
  const typeSpecificPhrases = {
    file_operation: [
      'Working with files...',
      'Processing file system...',
      'Managing file operations...',
    ],
    network_operation: [
      'Communicating with servers...',
      'Handling network requests...',
      'Managing online resources...',
    ],
    code_analysis: [
      'Analyzing code structure...',
      'Examining source files...',
      'Running code diagnostics...',
    ],
    build_operation: [
      'Compiling project...',
      'Creating build artifacts...',
      'Optimizing output...',
    ],
    test_operation: [
      'Running test suite...',
      'Validating functionality...',
      'Executing quality checks...',
    ],
    git_operation: [
      'Managing version control...',
      'Synchronizing with repository...',
      'Handling Git operations...',
    ],
    package_operation: [
      'Managing dependencies...',
      'Handling package registry...',
      'Updating project packages...',
    ],
    search_operation: [
      'Searching through codebase...',
      'Finding relevant content...',
      'Scanning project files...',
    ],
    general_operation: [
      'Processing request...',
      'Executing operation...',
      'Working on task...',
    ],
  };
  const phrases = typeSpecificPhrases[operationType];
  if (phrases && phrases.length > 0) {
    return phrases[Math.floor(Math.random() * phrases.length)];
  }
  return null;
}
/**
 * Get a generic phrase as fallback
 */
function getGenericPhrase() {
  const genericPhrases = [
    'Processing your request...',
    'Working on it...',
    'Making progress...',
    'Almost ready...',
    'Just a moment...',
    'Getting things done...',
    'Organizing thoughts...',
    'Preparing response...',
    'Computing solution...',
    'Assembling results...',
  ];
  return {
    message: genericPhrases[Math.floor(Math.random() * genericPhrases.length)],
    isSpecific: false,
  };
}
/**
 * Utility function to extract filename from path
 */
function getFileName(filePath) {
  if (!filePath) return 'file';
  return filePath.split('/').pop() || filePath;
}
//# sourceMappingURL=useContextualPhrases.js.map
