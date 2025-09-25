/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import fs from 'node:fs';
import path from 'node:path';
export class Override {
    baseRule;
    isDisable;
    includeSubdirs;
    constructor(baseRule, isDisable, includeSubdirs) {
        this.baseRule = baseRule;
        this.isDisable = isDisable;
        this.includeSubdirs = includeSubdirs;
    }
    static fromInput(inputRule, includeSubdirs) {
        const isDisable = inputRule.startsWith('!');
        let baseRule = isDisable ? inputRule.substring(1) : inputRule;
        baseRule = ensureLeadingAndTrailingSlash(baseRule);
        return new Override(baseRule, isDisable, includeSubdirs);
    }
    static fromFileRule(fileRule) {
        const isDisable = fileRule.startsWith('!');
        let baseRule = isDisable ? fileRule.substring(1) : fileRule;
        const includeSubdirs = baseRule.endsWith('*');
        baseRule = includeSubdirs
            ? baseRule.substring(0, baseRule.length - 1)
            : baseRule;
        return new Override(baseRule, isDisable, includeSubdirs);
    }
    conflictsWith(other) {
        if (this.baseRule === other.baseRule) {
            return (this.includeSubdirs !== other.includeSubdirs ||
                this.isDisable !== other.isDisable);
        }
        return false;
    }
    isEqualTo(other) {
        return (this.baseRule === other.baseRule &&
            this.includeSubdirs === other.includeSubdirs &&
            this.isDisable === other.isDisable);
    }
    asRegex() {
        return globToRegex(`${this.baseRule}${this.includeSubdirs ? '*' : ''}`);
    }
    isChildOf(parent) {
        if (!parent.includeSubdirs) {
            return false;
        }
        return parent.asRegex().test(this.baseRule);
    }
    output() {
        return `${this.isDisable ? '!' : ''}${this.baseRule}${this.includeSubdirs ? '*' : ''}`;
    }
    matchesPath(path) {
        return this.asRegex().test(path);
    }
}
const ensureLeadingAndTrailingSlash = function (dirPath) {
    // Normalize separators to forward slashes for consistent matching across platforms.
    let result = dirPath.replace(/\\/g, '/');
    if (result.charAt(0) !== '/') {
        result = '/' + result;
    }
    if (result.charAt(result.length - 1) !== '/') {
        result = result + '/';
    }
    return result;
};
/**
 * Converts a glob pattern to a RegExp object.
 * This is a simplified implementation that supports `*`.
 *
 * @param glob The glob pattern to convert.
 * @returns A RegExp object.
 */
function globToRegex(glob) {
    const regexString = glob
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special regex characters
        .replace(/(\/?)\*/g, '($1.*)?'); // Convert * to optional group
    return new RegExp(`^${regexString}$`);
}
/**
 * Determines if an extension is enabled based on the configuration and current path.
 * The last matching rule in the overrides list wins.
 *
 * @param config The enablement configuration for a single extension.
 * @param currentPath The absolute path of the current working directory.
 * @returns True if the extension is enabled, false otherwise.
 */
export class ExtensionEnablementManager {
    configFilePath;
    configDir;
    constructor(configDir) {
        this.configDir = configDir;
        this.configFilePath = path.join(configDir, 'extension-enablement.json');
    }
    isEnabled(extensionName, currentPath) {
        const config = this.readConfig();
        const extensionConfig = config[extensionName];
        // Extensions are enabled by default.
        let enabled = true;
        const allOverrides = extensionConfig?.overrides ?? [];
        for (const rule of allOverrides) {
            const override = Override.fromFileRule(rule);
            if (override.matchesPath(ensureLeadingAndTrailingSlash(currentPath))) {
                enabled = !override.isDisable;
            }
        }
        return enabled;
    }
    readConfig() {
        try {
            const content = fs.readFileSync(this.configFilePath, 'utf-8');
            return JSON.parse(content);
        }
        catch (error) {
            if (error instanceof Error &&
                'code' in error &&
                error.code === 'ENOENT') {
                return {};
            }
            console.error('Error reading extension enablement config:', error);
            return {};
        }
    }
    writeConfig(config) {
        fs.mkdirSync(this.configDir, { recursive: true });
        fs.writeFileSync(this.configFilePath, JSON.stringify(config, null, 2));
    }
    enable(extensionName, includeSubdirs, scopePath) {
        const config = this.readConfig();
        if (!config[extensionName]) {
            config[extensionName] = { overrides: [] };
        }
        const override = Override.fromInput(scopePath, includeSubdirs);
        const overrides = config[extensionName].overrides.filter((rule) => {
            const fileOverride = Override.fromFileRule(rule);
            if (fileOverride.conflictsWith(override) ||
                fileOverride.isEqualTo(override)) {
                return false; // Remove conflicts and equivalent values.
            }
            return !fileOverride.isChildOf(override);
        });
        overrides.push(override.output());
        config[extensionName].overrides = overrides;
        this.writeConfig(config);
    }
    disable(extensionName, includeSubdirs, scopePath) {
        this.enable(extensionName, includeSubdirs, `!${scopePath}`);
    }
    remove(extensionName) {
        const config = this.readConfig();
        if (config[extensionName]) {
            delete config[extensionName];
            this.writeConfig(config);
        }
    }
}
//# sourceMappingURL=extensionEnablement.js.map