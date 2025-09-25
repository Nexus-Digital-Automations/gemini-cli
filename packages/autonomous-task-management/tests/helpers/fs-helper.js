/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { vol } from 'memfs';
export const fsHelper = {
    /**
     * Create a mock file system structure
     */
    createMockFs(structure) {
        const directoryJson = this.convertToDirectoryJson(structure);
        vol.fromJSON(directoryJson);
    },
    /**
     * Convert TestFileSystem structure to DirectoryJSON format
     */
    convertToDirectoryJson(structure, basePath = '') {
        const result = {};
        for (const [name, content] of Object.entries(structure)) {
            const fullPath = basePath ? `${basePath}/${name}` : `/${name}`;
            if (typeof content === 'string') {
                // File content
                result[fullPath] = content;
            }
            else {
                // Directory - recursively process
                Object.assign(result, this.convertToDirectoryJson(content, fullPath));
            }
        }
        return result;
    },
    /**
     * Create a basic project structure for testing
     */
    createBasicProjectStructure(projectRoot = '/test-project') {
        this.createMockFs({
            [projectRoot.substring(1)]: {
                'package.json': JSON.stringify({
                    name: 'test-project',
                    version: '1.0.0',
                    scripts: {
                        test: 'vitest',
                        build: 'tsc',
                        lint: 'eslint .',
                        start: 'node dist/index.js'
                    }
                }, null, 2),
                'FEATURES.json': JSON.stringify({
                    project: 'test-project',
                    features: [],
                    metadata: {
                        version: '1.0.0',
                        created: '2025-09-25T00:00:00.000Z',
                        updated: '2025-09-25T00:00:00.000Z',
                        total_features: 0,
                        approval_history: []
                    },
                    workflow_config: {
                        require_approval: true,
                        auto_reject_timeout_hours: 168,
                        allowed_statuses: ['suggested', 'approved', 'rejected', 'implemented'],
                        required_fields: ['title', 'description', 'business_value', 'category']
                    },
                    agents: {},
                    tasks: [],
                    completed_tasks: []
                }, null, 2),
                src: {
                    'index.ts': 'console.log("Hello World");'
                },
                tests: {
                    'example.test.ts': 'import { test, expect } from "vitest"; test("basic test", () => { expect(1 + 1).toBe(2); });'
                }
            }
        });
    },
    /**
     * Create FEATURES.json with test data
     */
    createFeaturesFile(projectRoot, features = []) {
        const featuresContent = {
            project: 'test-project',
            features,
            metadata: {
                version: '1.0.0',
                created: '2025-09-25T00:00:00.000Z',
                updated: new Date().toISOString(),
                total_features: features.length,
                approval_history: [],
                initialization_stats: {
                    total_initializations: 0,
                    total_reinitializations: 0,
                    current_day: new Date().toISOString().split('T')[0],
                    time_buckets: {
                        '08:00-12:59': { init: 0, reinit: 0 },
                        '13:00-17:59': { init: 0, reinit: 0 },
                        '18:00-22:59': { init: 0, reinit: 0 },
                        '23:00-03:59': { init: 0, reinit: 0 },
                        '04:00-07:59': { init: 0, reinit: 0 }
                    },
                    daily_history: [],
                    last_reset: new Date().toISOString(),
                    last_updated: new Date().toISOString()
                }
            },
            workflow_config: {
                require_approval: true,
                auto_reject_timeout_hours: 168,
                allowed_statuses: ['suggested', 'approved', 'rejected', 'implemented'],
                required_fields: ['title', 'description', 'business_value', 'category']
            },
            agents: {},
            tasks: [],
            completed_tasks: []
        };
        vol.writeFileSync(`${projectRoot}/FEATURES.json`, JSON.stringify(featuresContent, null, 2));
    },
    /**
     * Get the current mock file system state
     */
    getMockFs() {
        return vol.toJSON();
    },
    /**
     * Reset the mock file system
     */
    resetMockFs() {
        vol.reset();
    },
    /**
     * Check if a file exists in the mock file system
     */
    exists(path) {
        try {
            vol.statSync(path);
            return true;
        }
        catch {
            return false;
        }
    },
    /**
     * Read a file from the mock file system
     */
    readFile(path) {
        return vol.readFileSync(path, 'utf8');
    },
    /**
     * Write a file to the mock file system
     */
    writeFile(path, content) {
        vol.writeFileSync(path, content);
    },
    /**
     * Create a test lock file
     */
    createLockFile(filePath, pid = 12345) {
        vol.writeFileSync(`${filePath}.lock`, pid.toString());
    },
    /**
     * Remove a test lock file
     */
    removeLockFile(filePath) {
        try {
            vol.unlinkSync(`${filePath}.lock`);
        }
        catch {
            // File doesn't exist
        }
    }
};
//# sourceMappingURL=fs-helper.js.map