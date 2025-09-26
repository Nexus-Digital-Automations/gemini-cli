/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState, useCallback, } from 'react';
import { globalProgressTracker, OperationDetector, } from '@google/gemini-cli-core';
const ProgressContext = createContext(undefined);
export const ProgressProvider = ({ children, }) => {
    const [activeOperations, setActiveOperations] = useState([]);
    const [isProgressPanelExpanded, setIsProgressPanelExpanded] = useState(false);
    // Get the primary operation (most recent active operation)
    const primaryOperation = activeOperations.length > 0
        ? activeOperations[activeOperations.length - 1]
        : undefined;
    // Update active operations when progress changes
    const updateActiveOperations = useCallback(() => {
        const operations = globalProgressTracker.getActiveOperations();
        setActiveOperations([...operations]);
    }, []);
    // Handle progress updates from the global tracker
    const handleProgressUpdate = useCallback((update) => {
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
    }, [updateActiveOperations]);
    // Set up progress tracker listener
    useEffect(() => {
        const unsubscribe = globalProgressTracker.onUpdate(handleProgressUpdate);
        // Initial load of active operations
        updateActiveOperations();
        return unsubscribe;
    }, [handleProgressUpdate, updateActiveOperations]);
    // Operation management methods
    const startOperation = useCallback((toolCall, toolCallId) => {
        const context = OperationDetector.detectOperation(toolCall);
        const operationId = globalProgressTracker.startOperation(context, toolCallId);
        // Auto-create steps for known multi-step operations
        autoCreateSteps(operationId, context, toolCall);
        return operationId;
    }, []);
    const updateOperationProgress = useCallback((operationId, stepId, progress, intermediateResult) => {
        globalProgressTracker.updateStepProgress(operationId, stepId, progress, intermediateResult);
    }, []);
    const completeOperation = useCallback((operationId) => {
        globalProgressTracker.completeOperation(operationId);
    }, []);
    const failOperation = useCallback((operationId, error) => {
        globalProgressTracker.failOperation(operationId, error);
    }, []);
    // Step management methods
    const addStep = useCallback((operationId, stepId, description) => {
        globalProgressTracker.addStep(operationId, stepId, description);
    }, []);
    const startStep = useCallback((operationId, stepId) => {
        globalProgressTracker.startStep(operationId, stepId);
    }, []);
    const completeStep = useCallback((operationId, stepId, finalResult) => {
        globalProgressTracker.completeStep(operationId, stepId, finalResult);
    }, []);
    const failStep = useCallback((operationId, stepId, error) => {
        globalProgressTracker.failStep(operationId, stepId, error);
    }, []);
    // User interaction handling
    const handleInteraction = useCallback((interaction) => {
        if (interaction.type === 'expand_details') {
            setIsProgressPanelExpanded(true);
            return true;
        }
        if (interaction.type === 'collapse_details') {
            setIsProgressPanelExpanded(false);
            return true;
        }
        return globalProgressTracker.handleInteraction(interaction);
    }, []);
    const toggleProgressPanel = useCallback(() => {
        setIsProgressPanelExpanded((prev) => !prev);
    }, []);
    const cleanup = useCallback(() => {
        globalProgressTracker.cleanup();
        updateActiveOperations();
    }, [updateActiveOperations]);
    const value = {
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
    return (_jsx(ProgressContext.Provider, { value, children }));
};
export const useProgress = () => {
    const context = useContext(ProgressContext);
    if (context === undefined) {
        throw new Error('useProgress must be used within a ProgressProvider');
    }
    return context;
};
// Auto-create steps for known operations that have predictable step patterns
function autoCreateSteps(operationId, context, toolCall) {
    const { name, args } = toolCall;
    switch (name) {
        case 'MultiEdit': {
            const edits = args['edits'] || [];
            edits.forEach((_, index) => {
                globalProgressTracker.addStep(operationId, `edit_${index}`, `Apply edit ${index + 1} of ${edits.length}`);
            });
            break;
        }
        case 'Bash': {
            const command = args['command'];
            if (command?.includes('npm install') ||
                command?.includes('yarn install')) {
                globalProgressTracker.addStep(operationId, 'download', 'Downloading packages');
                globalProgressTracker.addStep(operationId, 'install', 'Installing dependencies');
                globalProgressTracker.addStep(operationId, 'postinstall', 'Running post-install scripts');
            }
            else if (command?.includes('npm run build') ||
                command?.includes('yarn build')) {
                globalProgressTracker.addStep(operationId, 'analyze', 'Analyzing project structure');
                globalProgressTracker.addStep(operationId, 'compile', 'Compiling source code');
                globalProgressTracker.addStep(operationId, 'bundle', 'Creating bundles');
                globalProgressTracker.addStep(operationId, 'optimize', 'Optimizing output');
            }
            else if (command?.includes('npm test') ||
                command?.includes('yarn test')) {
                globalProgressTracker.addStep(operationId, 'setup', 'Setting up test environment');
                globalProgressTracker.addStep(operationId, 'discover', 'Discovering test files');
                globalProgressTracker.addStep(operationId, 'execute', 'Running tests');
                globalProgressTracker.addStep(operationId, 'report', 'Generating test report');
            }
            else {
                // Generic bash command - single step
                globalProgressTracker.addStep(operationId, 'execute', 'Executing command');
            }
            break;
        }
        case 'Grep': {
            if (args['path']) {
                globalProgressTracker.addStep(operationId, 'scan', 'Scanning files');
                globalProgressTracker.addStep(operationId, 'search', 'Searching patterns');
                globalProgressTracker.addStep(operationId, 'format', 'Formatting results');
            }
            else {
                globalProgressTracker.addStep(operationId, 'search', 'Searching patterns');
            }
            break;
        }
        case 'WebFetch': {
            globalProgressTracker.addStep(operationId, 'connect', 'Connecting to server');
            globalProgressTracker.addStep(operationId, 'fetch', 'Fetching content');
            globalProgressTracker.addStep(operationId, 'process', 'Processing response');
            break;
        }
        case 'Task': {
            globalProgressTracker.addStep(operationId, 'initialize', 'Initializing agent');
            globalProgressTracker.addStep(operationId, 'execute', 'Executing task');
            globalProgressTracker.addStep(operationId, 'finalize', 'Finalizing results');
            break;
        }
        default: {
            // Single step for simple operations
            globalProgressTracker.addStep(operationId, 'execute', context.description);
            break;
        }
    }
}
//# sourceMappingURL=ProgressContext.js.map