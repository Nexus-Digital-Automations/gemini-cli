/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import type { StreamingState } from '../types.js';
export declare const StreamingContext: React.Context<StreamingState | undefined>;
export declare const useStreamingContext: () => StreamingState;
