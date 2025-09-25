/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { useProgress } from '../contexts/ProgressContext.js';
import { ToolCallStatus } from '../types.js';
/**
 * Hook for managing tool-specific progress tracking
 */
export const useToolProgress = (initialStatus = ToolCallStatus.Pending) => {
    const progressContext = useProgress();
    const [operationId, setOperationId] = useState();
    const [status, setStatus] = useState(initialStatus);
    const [_currentStepIndex, setCurrentStepIndex] = useState(0);
    // Get the current operation from the progress context
    const operation = operationId
        ? progressContext.activeOperations.find((op) => op.operationId === operationId)
        : undefined;
    // Derive state from operation
    const isTracking = !!operation;
    const estimatedTimeRemaining = operation?.estimatedTimeRemaining;
    const overallProgress = operation?.overallProgress || 0;
    const canInteract = operation?.canPause || operation?.canCancel || false;
    // Get current step description
    const currentStepDescription = operation?.steps[operation.currentStepIndex]?.description;
    // Auto-sync status with operation state
    useEffect(() => {
        if (operation) {
            switch (operation.state) {
                case 'initializing':
                    setStatus(ToolCallStatus.Pending);
                    break;
                case 'in_progress':
                    setStatus(ToolCallStatus.Executing);
                    break;
                case 'completed':
                    setStatus(ToolCallStatus.Success);
                    break;
                case 'failed':
                    setStatus(ToolCallStatus.Error);
                    break;
                case 'cancelled':
                    setStatus(ToolCallStatus.Canceled);
                    break;
                default:
                    break;
            }
        }
    }, [operation]);
    // Tool progress actions
    const startTracking = useCallback((toolCall, toolCallId) => {
        const newOperationId = progressContext.startOperation(toolCall, toolCallId);
        setOperationId(newOperationId);
        setStatus(ToolCallStatus.Executing);
        setCurrentStepIndex(0);
        // Auto-start the first step if available
        const newOperation = progressContext.activeOperations.find((op) => op.operationId === newOperationId);
        if (newOperation && newOperation.steps.length > 0) {
            progressContext.startStep(newOperationId, newOperation.steps[0].id);
        }
    }, [progressContext]);
    const updateProgress = useCallback((stepId, progress, intermediateResult) => {
        if (operationId) {
            progressContext.updateOperationProgress(operationId, stepId, progress, intermediateResult);
        }
    }, [operationId, progressContext]);
    const nextStep = useCallback((stepId) => {
        if (!operationId || !operation)
            return;
        // Complete current step if it exists
        const currentStep = operation.steps[operation.currentStepIndex];
        if (currentStep && currentStep.state === 'in_progress') {
            progressContext.completeStep(operationId, currentStep.id);
        }
        // Start next step
        let nextStepIndex;
        if (stepId) {
            nextStepIndex = operation.steps.findIndex((step) => step.id === stepId);
        }
        else {
            nextStepIndex = operation.currentStepIndex + 1;
        }
        if (nextStepIndex >= 0 && nextStepIndex < operation.steps.length) {
            const nextStep = operation.steps[nextStepIndex];
            progressContext.startStep(operationId, nextStep.id);
            setCurrentStepIndex(nextStepIndex);
        }
    }, [operationId, operation, progressContext]);
    const complete = useCallback((finalResult) => {
        if (!operationId || !operation)
            return;
        // Complete current step if in progress
        const currentStep = operation.steps[operation.currentStepIndex];
        if (currentStep && currentStep.state === 'in_progress') {
            progressContext.completeStep(operationId, currentStep.id, finalResult);
        }
        // Complete the entire operation
        progressContext.completeOperation(operationId);
        setStatus(ToolCallStatus.Success);
    }, [operationId, operation, progressContext]);
    const fail = useCallback((error) => {
        if (!operationId)
            return;
        progressContext.failOperation(operationId, error);
        setStatus(ToolCallStatus.Error);
    }, [operationId, progressContext]);
    const cancel = useCallback(() => {
        if (!operationId)
            return;
        const success = progressContext.handleInteraction({
            type: 'cancel',
            operationId,
        });
        if (success) {
            setStatus(ToolCallStatus.Canceled);
        }
    }, [operationId, progressContext]);
    const pause = useCallback(() => {
        if (!operationId)
            return;
        progressContext.handleInteraction({
            type: 'pause',
            operationId,
        });
    }, [operationId, progressContext]);
    const resume = useCallback(() => {
        if (!operationId)
            return;
        progressContext.handleInteraction({
            type: 'resume',
            operationId,
        });
    }, [operationId, progressContext]);
    return {
        // State
        operationId,
        operation,
        status,
        isTracking,
        estimatedTimeRemaining,
        currentStepDescription,
        overallProgress,
        canInteract,
        // Actions
        startTracking,
        updateProgress,
        nextStep,
        complete,
        fail,
        cancel,
        pause,
        resume,
    };
};
/**
 * Simplified hook for basic tool progress without step management
 */
export const useSimpleToolProgress = () => {
    const [status, setStatus] = useState(ToolCallStatus.Pending);
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState();
    const start = useCallback((message) => {
        setStatus(ToolCallStatus.Executing);
        setProgress(0);
        setMessage(message);
    }, []);
    const updateProgress = useCallback((newProgress, message) => {
        setProgress(Math.max(0, Math.min(100, newProgress)));
        if (message)
            setMessage(message);
    }, []);
    const complete = useCallback((message) => {
        setStatus(ToolCallStatus.Success);
        setProgress(100);
        if (message)
            setMessage(message);
    }, []);
    const fail = useCallback((error) => {
        setStatus(ToolCallStatus.Error);
        setMessage(error);
    }, []);
    const cancel = useCallback(() => {
        setStatus(ToolCallStatus.Canceled);
        setMessage('Cancelled by user');
    }, []);
    return {
        status,
        progress,
        message,
        start,
        updateProgress,
        complete,
        fail,
        cancel,
    };
};
//# sourceMappingURL=useToolProgress.js.map