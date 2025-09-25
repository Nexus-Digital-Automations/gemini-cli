/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import ignore from 'ignore';
import { getComponentLogger, createTimer, LogLevel } from './logger.js';
const logger = getComponentLogger('GitIgnoreParser');
export class GitIgnoreParser {
    projectRoot;
    cache = new Map();
    globalPatterns;
    initialized = false;
    initPromise = null;
    fileCache = new Map(); // Cache file contents
    constructor(projectRoot) {
        this.projectRoot = path.resolve(projectRoot);
    }
    async initialize() {
        if (this.initialized) {
            return;
        }
        if (this.initPromise) {
            return this.initPromise;
        }
        this.initPromise = this.initializeAsync();
        await this.initPromise;
        this.initialized = true;
    }
    async initializeAsync() {
        const endTimer = createTimer(logger, 'initializeAsync', LogLevel.DEBUG);
        try {
            // Pre-load global patterns from .git/info/exclude
            const excludeFile = path.join(this.projectRoot, '.git', 'info', 'exclude');
            this.globalPatterns = await this.loadPatternsForFileAsync(excludeFile);
            logger.debug('Initialized GitIgnoreParser', {
                projectRoot: this.projectRoot,
                globalPatternCount: this.globalPatterns.length
            });
        }
        catch (error) {
            logger.warn('Failed to initialize GitIgnoreParser', { error: error });
            this.globalPatterns = [];
        }
        finally {
            endTimer();
        }
    }
    async loadPatternsForFileAsync(patternsFilePath) {
        // Check file cache first
        let content;
        if (this.fileCache.has(patternsFilePath)) {
            content = this.fileCache.get(patternsFilePath);
        }
        else {
            try {
                content = await fs.promises.readFile(patternsFilePath, 'utf-8');
                this.fileCache.set(patternsFilePath, content);
            }
            catch (_error) {
                return [];
            }
        }
        const isExcludeFile = patternsFilePath.endsWith(path.join('.git', 'info', 'exclude'));
        const relativeBaseDir = isExcludeFile
            ? '.'
            : path.dirname(path.relative(this.projectRoot, patternsFilePath));
        return content
            .split('\n')
            .map((p) => p.trim())
            .filter((p) => p !== '' && !p.startsWith('#'))
            .map((p) => {
            const isNegative = p.startsWith('!');
            if (isNegative) {
                p = p.substring(1);
            }
            const isAnchoredInFile = p.startsWith('/');
            if (isAnchoredInFile) {
                p = p.substring(1);
            }
            // An empty pattern can result from a negated pattern like `!`,
            // which we can ignore.
            if (p === '') {
                return '';
            }
            let newPattern = p;
            if (relativeBaseDir && relativeBaseDir !== '.') {
                // Only in nested .gitignore files, the patterns need to be modified according to:
                // - If `a/b/.gitignore` defines `/c` then it needs to be changed to `/a/b/c`
                // - If `a/b/.gitignore` defines `c` then it needs to be changed to `/a/b/**/c`
                // - If `a/b/.gitignore` defines `c/d` then it needs to be changed to `/a/b/c/d`
                if (!isAnchoredInFile && !p.includes('/')) {
                    // If no slash and not anchored in file, it matches files in any
                    // subdirectory.
                    newPattern = path.join('**', p);
                }
                // Prepend the .gitignore file's directory.
                newPattern = path.join(relativeBaseDir, newPattern);
                // Anchor the pattern to a nested gitignore directory.
                if (!newPattern.startsWith('/')) {
                    newPattern = '/' + newPattern;
                }
            }
            // Anchor the pattern if originally anchored
            if (isAnchoredInFile && !newPattern.startsWith('/')) {
                newPattern = '/' + newPattern;
            }
            if (isNegative) {
                newPattern = '!' + newPattern;
            }
            // Even in windows, Ignore expects forward slashes.
            newPattern = newPattern.replace(/\\/g, '/');
            return newPattern;
        })
            .filter((p) => p !== '');
    }
    loadPatternsForFile(patternsFilePath) {
        let content;
        try {
            content = fs.readFileSync(patternsFilePath, 'utf-8');
        }
        catch (_error) {
            return [];
        }
        const isExcludeFile = patternsFilePath.endsWith(path.join('.git', 'info', 'exclude'));
        const relativeBaseDir = isExcludeFile
            ? '.'
            : path.dirname(path.relative(this.projectRoot, patternsFilePath));
        return content
            .split('\n')
            .map((p) => p.trim())
            .filter((p) => p !== '' && !p.startsWith('#'))
            .map((p) => {
            const isNegative = p.startsWith('!');
            if (isNegative) {
                p = p.substring(1);
            }
            const isAnchoredInFile = p.startsWith('/');
            if (isAnchoredInFile) {
                p = p.substring(1);
            }
            // An empty pattern can result from a negated pattern like `!`,
            // which we can ignore.
            if (p === '') {
                return '';
            }
            let newPattern = p;
            if (relativeBaseDir && relativeBaseDir !== '.') {
                // Only in nested .gitignore files, the patterns need to be modified according to:
                // - If `a/b/.gitignore` defines `/c` then it needs to be changed to `/a/b/c`
                // - If `a/b/.gitignore` defines `c` then it needs to be changed to `/a/b/**/c`
                // - If `a/b/.gitignore` defines `c/d` then it needs to be changed to `/a/b/c/d`
                if (!isAnchoredInFile && !p.includes('/')) {
                    // If no slash and not anchored in file, it matches files in any
                    // subdirectory.
                    newPattern = path.join('**', p);
                }
                // Prepend the .gitignore file's directory.
                newPattern = path.join(relativeBaseDir, newPattern);
                // Anchor the pattern to a nested gitignore directory.
                if (!newPattern.startsWith('/')) {
                    newPattern = '/' + newPattern;
                }
            }
            // Anchor the pattern if originally anchored
            if (isAnchoredInFile && !newPattern.startsWith('/')) {
                newPattern = '/' + newPattern;
            }
            if (isNegative) {
                newPattern = '!' + newPattern;
            }
            // Even in windows, Ignore expects forward slashes.
            newPattern = newPattern.replace(/\\/g, '/');
            return newPattern;
        })
            .filter((p) => p !== '');
    }
    isIgnored(filePath) {
        if (!filePath || typeof filePath !== 'string') {
            return false;
        }
        const absoluteFilePath = path.resolve(this.projectRoot, filePath);
        if (!absoluteFilePath.startsWith(this.projectRoot)) {
            return false;
        }
        try {
            const resolved = path.resolve(this.projectRoot, filePath);
            const relativePath = path.relative(this.projectRoot, resolved);
            if (relativePath === '' || relativePath.startsWith('..')) {
                return false;
            }
            // Even in windows, Ignore expects forward slashes.
            const normalizedPath = relativePath.replace(/\\/g, '/');
            if (normalizedPath.startsWith('/') || normalizedPath === '') {
                return false;
            }
            const ig = ignore();
            // Always ignore .git directory
            ig.add('.git');
            // Load global patterns from .git/info/exclude on first call
            if (this.globalPatterns === undefined) {
                const excludeFile = path.join(this.projectRoot, '.git', 'info', 'exclude');
                this.globalPatterns = fs.existsSync(excludeFile)
                    ? this.loadPatternsForFile(excludeFile)
                    : [];
            }
            ig.add(this.globalPatterns);
            const pathParts = relativePath.split(path.sep);
            const dirsToVisit = [this.projectRoot];
            let currentAbsDir = this.projectRoot;
            // Collect all directories in the path
            for (let i = 0; i < pathParts.length - 1; i++) {
                currentAbsDir = path.join(currentAbsDir, pathParts[i]);
                dirsToVisit.push(currentAbsDir);
            }
            for (const dir of dirsToVisit) {
                const relativeDir = path.relative(this.projectRoot, dir);
                if (relativeDir) {
                    const normalizedRelativeDir = relativeDir.replace(/\\/g, '/');
                    if (ig.ignores(normalizedRelativeDir)) {
                        // This directory is ignored by an ancestor's .gitignore.
                        // According to git behavior, we don't need to process this
                        // directory's .gitignore, as nothing inside it can be
                        // un-ignored.
                        break;
                    }
                }
                if (this.cache.has(dir)) {
                    const patterns = this.cache.get(dir);
                    if (patterns) {
                        ig.add(patterns);
                    }
                }
                else {
                    const gitignorePath = path.join(dir, '.gitignore');
                    if (fs.existsSync(gitignorePath)) {
                        const patterns = this.loadPatternsForFile(gitignorePath);
                        this.cache.set(dir, patterns);
                        ig.add(patterns);
                    }
                    else {
                        this.cache.set(dir, []); // Cache miss
                    }
                }
            }
            return ig.ignores(normalizedPath);
        }
        catch (_error) {
            return false;
        }
    }
    async isIgnoredAsync(filePath) {
        if (!filePath || typeof filePath !== 'string') {
            return false;
        }
        const absoluteFilePath = path.resolve(this.projectRoot, filePath);
        if (!absoluteFilePath.startsWith(this.projectRoot)) {
            return false;
        }
        try {
            const resolved = path.resolve(this.projectRoot, filePath);
            const relativePath = path.relative(this.projectRoot, resolved);
            if (relativePath === '' || relativePath.startsWith('..')) {
                return false;
            }
            // Even in windows, Ignore expects forward slashes.
            const normalizedPath = relativePath.replace(/\\/g, '/');
            if (normalizedPath.startsWith('/') || normalizedPath === '') {
                return false;
            }
            const ig = ignore();
            // Always ignore .git directory
            ig.add('.git');
            // Load global patterns from .git/info/exclude on first call
            if (this.globalPatterns === undefined) {
                const excludeFile = path.join(this.projectRoot, '.git', 'info', 'exclude');
                try {
                    // Use async exists check with cache
                    const stats = await fs.promises.stat(excludeFile);
                    this.globalPatterns = stats.isFile()
                        ? await this.loadPatternsForFileAsync(excludeFile)
                        : [];
                }
                catch {
                    this.globalPatterns = [];
                }
            }
            ig.add(this.globalPatterns);
            const pathParts = relativePath.split(path.sep);
            const dirsToVisit = [this.projectRoot];
            let currentAbsDir = this.projectRoot;
            // Collect all directories in the path
            for (let i = 0; i < pathParts.length - 1; i++) {
                currentAbsDir = path.join(currentAbsDir, pathParts[i]);
                dirsToVisit.push(currentAbsDir);
            }
            // Process directories in parallel where possible
            const dirPromises = dirsToVisit.map(async (dir) => {
                const relativeDir = path.relative(this.projectRoot, dir);
                if (relativeDir) {
                    const normalizedRelativeDir = relativeDir.replace(/\\/g, '/');
                    if (ig.ignores(normalizedRelativeDir)) {
                        // This directory is ignored by an ancestor's .gitignore.
                        return null; // Skip processing
                    }
                }
                if (this.cache.has(dir)) {
                    return { dir, patterns: this.cache.get(dir) };
                }
                const gitignorePath = path.join(dir, '.gitignore');
                try {
                    const stats = await fs.promises.stat(gitignorePath);
                    if (stats.isFile()) {
                        const patterns = await this.loadPatternsForFileAsync(gitignorePath);
                        this.cache.set(dir, patterns);
                        return { dir, patterns };
                    }
                }
                catch {
                    // File doesn't exist
                }
                this.cache.set(dir, []); // Cache miss
                return { dir, patterns: [] };
            });
            const dirResults = await Promise.all(dirPromises);
            // Apply patterns in order
            for (const result of dirResults) {
                if (result && result.patterns) {
                    ig.add(result.patterns);
                }
            }
            return ig.ignores(normalizedPath);
        }
        catch (_error) {
            return false;
        }
    }
}
//# sourceMappingURL=gitIgnoreParser.js.map