/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Argv } from 'yargs';
/**
 * CLI command registration for knowledge base management
 */
export declare const knowledgeCommand: {
    command: string;
    describe: string;
    builder: (yargs: Argv) => Argv<{}>;
    handler: () => void;
};
