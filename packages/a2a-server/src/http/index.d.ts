/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import express from 'express';

export declare const requestStorage: AsyncLocalStorage<any>;

export declare function updateCoderAgentCardUrl(port: number): void;

export declare function createApp(): Promise<express.Application>;

export declare function main(): Promise<void>;