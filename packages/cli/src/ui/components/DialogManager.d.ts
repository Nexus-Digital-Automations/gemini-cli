/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { type UseHistoryManagerReturn } from '../hooks/useHistoryManager.js';
interface DialogManagerProps {
    addItem: UseHistoryManagerReturn['addItem'];
}
export declare const DialogManager: ({ addItem }: DialogManagerProps) => import("react/jsx-runtime").JSX.Element | null;
export {};
