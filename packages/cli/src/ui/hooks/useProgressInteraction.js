/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { useInput } from 'ink';
import { useProgress } from '../contexts/ProgressContext.js';
/**
 * Hook that handles keyboard interactions for progress management
 */
export const useProgressInteraction = (options = {}) => {
    const { enabled = true, allowKeyboardControl = true } = options;
    const { primaryOperation, handleInteraction, toggleProgressPanel } = useProgress();
    useInput((input, key) => {
        // Only handle input if enabled and there's an active operation
        if (!enabled || !allowKeyboardControl || !primaryOperation) {
            return;
        }
        // Tab key - toggle progress panel expansion
        if (key.tab) {
            toggleProgressPanel();
            return;
        }
        // Space key - pause/resume operation
        if (input === ' ' && !key.ctrl && !key.meta) {
            if (primaryOperation.canPause) {
                const isPaused = primaryOperation.state === 'paused';
                handleInteraction({
                    type: isPaused ? 'resume' : 'pause',
                    operationId: primaryOperation.operationId,
                });
            }
            return;
        }
        // Escape key - cancel operation (only if not used for other purposes)
        if (key.escape) {
            if (primaryOperation.canCancel) {
                handleInteraction({
                    type: 'cancel',
                    operationId: primaryOperation.operationId,
                });
            }
            return;
        }
    }, { isActive: enabled && allowKeyboardControl && !!primaryOperation });
    return {
        hasActiveOperation: !!primaryOperation,
        canPause: primaryOperation?.canPause || false,
        canCancel: primaryOperation?.canCancel || false,
        isPaused: primaryOperation?.state === 'paused',
    };
};
//# sourceMappingURL=useProgressInteraction.js.map