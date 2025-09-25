/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { render } from 'ink-testing-library';
import type React from 'react';
export declare const renderWithProviders: (component: React.ReactElement, { shellFocus }?: {
    shellFocus?: boolean | undefined;
}) => ReturnType<typeof render>;
