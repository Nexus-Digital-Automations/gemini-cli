/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
interface DefaultApi {
    [toolName: string]: (args: unknown) => Promise<{
        output: string;
    }>;
}
declare global {
    let default_api: DefaultApi;
}
export {};
