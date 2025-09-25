/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { readPackageUp, } from 'read-package-up';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getComponentLogger } from '@google/gemini-cli-core';
const logger = getComponentLogger('package-utils');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let packageJson;
export async function getPackageJson() {
    if (packageJson) {
        return packageJson;
    }
    const result = await readPackageUp({ cwd: __dirname });
    if (!result) {
        // Log for debugging but don't throw to maintain compatibility with callers
        // that expect graceful degradation when package.json is not available
        logger.warn('Could not locate package.json', { searchDir: __dirname });
        console.warn('Warning: Could not locate package.json from', __dirname);
        return;
    }
    packageJson = result.packageJson;
    return packageJson;
}
//# sourceMappingURL=package.js.map