/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import {
  globalProgressTracker,
  OperationDetector,
  type ProgressUpdateCallback,
  type ToolCallInfo,
} from '@google/gemini-cli-core';
import type {
  OperationProgress,
  ProgressUpdate,
  ProgressInteraction,
  OperationContext,
} from '../types.js';

export interface ProgressContextValue {
  // Active operations
  activeOperations: OperationProgress[];

  // Current primary operation (most recent or important)
  primaryOperation?: OperationProgress;

  // Operation management
  startOperation: (toolCall: ToolCallInfo, toolCallId?: string) => string;
  updateOperationProgress: (
    operationId: string,
    stepId: string,
    progress: number,
    intermediateResult?: unknown,
  ) => void;
  completeOperation: (operationId: string) => void;
  failOperation: (operationId: string, error: string) => void;

  // Step management
  addStep: (operationId: string, stepId: string, description: string) => void;
  startStep: (operationId: string, stepId: string) => void;
  completeStep: (
    operationId: string,
    stepId: string,
    finalResult?: unknown,
  ) => void;
  failStep: (operationId: string, stepId: string, error: string) => void;

  // User interactions
  handleInteraction: (interaction: ProgressInteraction) => boolean;

  // Progress panel state
  isProgressPanelExpanded: boolean;
  toggleProgressPanel: () => void;

  // Cleanup
  cleanup: () => void;
}

const ProgressContext = createContext<ProgressContextValue | undefined>(
  undefined,
);

export interface ProgressProviderProps {
  children: React.ReactNode;
}

export const ProgressProvider: React.FC<ProgressProviderProps> = ({
  children,
}) => {
  const [activeOperations, setActiveOperations] = useState<OperationProgress[]>(
    [],
  );
  const [isProgressPanelExpanded, setIsProgressPanelExpanded] = useState(false);

  // Get the primary operation (most recent active operation)
  const primaryOperation =
    activeOperations.length > 0
      ? activeOperations[activeOperations.length - 1]
      : undefined;

  // Update active operations when progress changes
  const updateActiveOperations = useCallback(() => {
    const operations = globalProgressTracker.getActiveOperations();
    setActiveOperations([...operations]);
  }, []);

  // Handle progress updates from the global tracker
  const handleProgressUpdate: ProgressUpdateCallback = useCallback(
    (update: ProgressUpdate) => {
      // Update active operations list
      updateActiveOperations();

      // Optionally handle specific update types
      switch (update.type) {
        case 'state_change':
          // Could trigger UI animations or notifications
          break;
        case 'error':
          // Could show error notifications
          break;
        case 'warning':
          // Could show warning notifications
          break;
        default:
          // Other update types don't require special handling
          break;
      }
    },
    [updateActiveOperations],
  );

  // Set up progress tracker listener
  useEffect(() => {
    const unsubscribe = globalProgressTracker.onUpdate(handleProgressUpdate);

    // Initial load of active operations
    updateActiveOperations();

    return unsubscribe;
  }, [handleProgressUpdate, updateActiveOperations]);

  // Operation management methods
  const startOperation = useCallback(
    (toolCall: ToolCallInfo, toolCallId?: string): string => {
      const context = OperationDetector.detectOperation(toolCall);
      const operationId = globalProgressTracker.startOperation(
        context,
        toolCallId,
      );

      // Auto-create steps for known multi-step operations
      autoCreateSteps(operationId, context, toolCall);

      return operationId;
    },
    [],
  );

  const updateOperationProgress = useCallback(
    (
      operationId: string,
      stepId: string,
      progress: number,
      intermediateResult?: unknown,
    ) => {
      globalProgressTracker.updateStepProgress(
        operationId,
        stepId,
        progress,
        intermediateResult,
      );
    },
    [],
  );

  const completeOperation = useCallback((operationId: string) => {
    globalProgressTracker.completeOperation(operationId);
  }, []);

  const failOperation = useCallback((operationId: string, error: string) => {
    globalProgressTracker.failOperation(operationId, error);
  }, []);

  // Step management methods
  const addStep = useCallback(
    (operationId: string, stepId: string, description: string) => {
      globalProgressTracker.addStep(operationId, stepId, description);
    },
    [],
  );

  const startStep = useCallback((operationId: string, stepId: string) => {
    globalProgressTracker.startStep(operationId, stepId);
  }, []);

  const completeStep = useCallback(
    (operationId: string, stepId: string, finalResult?: unknown) => {
      globalProgressTracker.completeStep(operationId, stepId, finalResult);
    },
    [],
  );

  const failStep = useCallback(
    (operationId: string, stepId: string, error: string) => {
      globalProgressTracker.failStep(operationId, stepId, error);
    },
    [],
  );

  // User interaction handling
  const handleInteraction = useCallback(
    (interaction: ProgressInteraction): boolean => {
      if (interaction.type === 'expand_details') {
        setIsProgressPanelExpanded(true);
        return true;
      }

      if (interaction.type === 'collapse_details') {
        setIsProgressPanelExpanded(false);
        return true;
      }

      return globalProgressTracker.handleInteraction(interaction);
    },
    [],
  );

  const toggleProgressPanel = useCallback(() => {
    setIsProgressPanelExpanded((prev) => !prev);
  }, []);

  const cleanup = useCallback(() => {
    globalProgressTracker.cleanup();
    updateActiveOperations();
  }, [updateActiveOperations]);

  const value: ProgressContextValue = {
    activeOperations,
    primaryOperation,
    startOperation,
    updateOperationProgress,
    completeOperation,
    failOperation,
    addStep,
    startStep,
    completeStep,
    failStep,
    handleInteraction,
    isProgressPanelExpanded,
    toggleProgressPanel,
    cleanup,
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = (): ProgressContextValue => {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

// Auto-create steps for known operations that have predictable step patterns
function autoCreateSteps(
  operationId: string,
  context: OperationContext,
  toolCall: ToolCallInfo,
): void {
  const { name, args } = toolCall;

  switch (name) {
    case 'MultiEdit': {
      const edits = (args['edits'] as unknown[]) || [];
      edits.forEach((_, index) => {
        globalProgressTracker.addStep(
          operationId,
          `edit_${index}`,
          `Apply edit ${index + 1} of ${edits.length}`,
        );
      });
      break;
    }

    case 'Bash': {
      const command = args['command'] as string;
      if (
        command?.includes('npm install') ||
        command?.includes('yarn install')
      ) {
        globalProgressTracker.addStep(
          operationId,
          'download',
          'Downloading packages',
        );
        globalProgressTracker.addStep(
          operationId,
          'install',
          'Installing dependencies',
        );
        globalProgressTracker.addStep(
          operationId,
          'postinstall',
          'Running post-install scripts',
        );
      } else if (
        command?.includes('npm run build') ||
        command?.includes('yarn build')
      ) {
        globalProgressTracker.addStep(
          operationId,
          'analyze',
          'Analyzing project structure',
        );
        globalProgressTracker.addStep(
          operationId,
          'compile',
          'Compiling source code',
        );
        globalProgressTracker.addStep(
          operationId,
          'bundle',
          'Creating bundles',
        );
        globalProgressTracker.addStep(
          operationId,
          'optimize',
          'Optimizing output',
        );
      } else if (
        command?.includes('npm test') ||
        command?.includes('yarn test')
      ) {
        globalProgressTracker.addStep(
          operationId,
          'setup',
          'Setting up test environment',
        );
        globalProgressTracker.addStep(
          operationId,
          'discover',
          'Discovering test files',
        );
        globalProgressTracker.addStep(operationId, 'execute', 'Running tests');
        globalProgressTracker.addStep(
          operationId,
          'report',
          'Generating test report',
        );
      } else {
        // Generic bash command - single step
        globalProgressTracker.addStep(
          operationId,
          'execute',
          'Executing command',
        );
      }
      break;
    }

    case 'Grep': {
      if (args['path']) {
        globalProgressTracker.addStep(operationId, 'scan', 'Scanning files');
        globalProgressTracker.addStep(
          operationId,
          'search',
          'Searching patterns',
        );
        globalProgressTracker.addStep(
          operationId,
          'format',
          'Formatting results',
        );
      } else {
        globalProgressTracker.addStep(
          operationId,
          'search',
          'Searching patterns',
        );
      }
      break;
    }

    case 'WebFetch': {
      globalProgressTracker.addStep(
        operationId,
        'connect',
        'Connecting to server',
      );
      globalProgressTracker.addStep(operationId, 'fetch', 'Fetching content');
      globalProgressTracker.addStep(
        operationId,
        'process',
        'Processing response',
      );
      break;
    }

    case 'Task': {
      globalProgressTracker.addStep(
        operationId,
        'initialize',
        'Initializing agent',
      );
      globalProgressTracker.addStep(operationId, 'execute', 'Executing task');
      globalProgressTracker.addStep(
        operationId,
        'finalize',
        'Finalizing results',
      );
      break;
    }

    default: {
      // Single step for simple operations
      globalProgressTracker.addStep(
        operationId,
        'execute',
        context.description,
      );
      break;
    }
  }
}
