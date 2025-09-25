/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { GitIgnoreParser } from '../utils/gitIgnoreParser.js';
import { GeminiIgnoreParser } from '../utils/geminiIgnoreParser.js';
import { isGitRepository } from '../utils/gitUtils.js';
import * as path from 'node:path';
export class FileDiscoveryService {
  gitIgnoreFilter = null;
  geminiIgnoreFilter = null;
  projectRoot;
  initialized = false;
  initPromise = null;
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
    // Initialize in parallel for better performance
    const promises = [];
    // Initialize Git ignore filter if in git repository
    if (isGitRepository(this.projectRoot)) {
      this.gitIgnoreFilter = new GitIgnoreParser(this.projectRoot);
      promises.push(this.gitIgnoreFilter.initialize());
    }
    // Initialize Gemini ignore filter
    this.geminiIgnoreFilter = new GeminiIgnoreParser(this.projectRoot);
    promises.push(this.geminiIgnoreFilter.initialize());
    await Promise.all(promises);
  }
  /**
   * Filters a list of file paths based on git ignore rules with performance optimization
   */
  filterFiles(
    filePaths,
    options = {
      respectGitIgnore: true,
      respectGeminiIgnore: true,
    },
  ) {
    // Early return for empty arrays
    if (filePaths.length === 0) {
      return [];
    }
    // Batch process for better performance with large file lists
    const BATCH_SIZE = 500;
    const results = [];
    for (let i = 0; i < filePaths.length; i += BATCH_SIZE) {
      const batch = filePaths.slice(i, i + BATCH_SIZE);
      const filteredBatch = batch.filter((filePath) => {
        if (options.respectGitIgnore && this.shouldGitIgnoreFile(filePath)) {
          return false;
        }
        if (
          options.respectGeminiIgnore &&
          this.shouldGeminiIgnoreFile(filePath)
        ) {
          return false;
        }
        return true;
      });
      results.push(...filteredBatch);
    }
    return results;
  }
  /**
   * Filters a list of file paths based on git ignore rules and returns a report
   * with counts of ignored files.
   */
  filterFilesWithReport(
    filePaths,
    opts = {
      respectGitIgnore: true,
      respectGeminiIgnore: true,
    },
  ) {
    const filteredPaths = [];
    let gitIgnoredCount = 0;
    let geminiIgnoredCount = 0;
    for (const filePath of filePaths) {
      if (opts.respectGitIgnore && this.shouldGitIgnoreFile(filePath)) {
        gitIgnoredCount++;
        continue;
      }
      if (opts.respectGeminiIgnore && this.shouldGeminiIgnoreFile(filePath)) {
        geminiIgnoredCount++;
        continue;
      }
      filteredPaths.push(filePath);
    }
    return {
      filteredPaths,
      gitIgnoredCount,
      geminiIgnoredCount,
    };
  }
  /**
   * Checks if a single file should be git-ignored
   */
  shouldGitIgnoreFile(filePath) {
    if (this.gitIgnoreFilter) {
      return this.gitIgnoreFilter.isIgnored(filePath);
    }
    return false;
  }
  /**
   * Checks if a single file should be gemini-ignored
   */
  shouldGeminiIgnoreFile(filePath) {
    if (this.geminiIgnoreFilter) {
      return this.geminiIgnoreFilter.isIgnored(filePath);
    }
    return false;
  }
  /**
   * Unified method to check if a file should be ignored based on filtering options
   */
  shouldIgnoreFile(filePath, options = {}) {
    const { respectGitIgnore = true, respectGeminiIgnore = true } = options;
    if (respectGitIgnore && this.shouldGitIgnoreFile(filePath)) {
      return true;
    }
    if (respectGeminiIgnore && this.shouldGeminiIgnoreFile(filePath)) {
      return true;
    }
    return false;
  }
  /**
   * Returns loaded patterns from .geminiignore
   */
  getGeminiIgnorePatterns() {
    return this.geminiIgnoreFilter?.getPatterns() ?? [];
  }
}
//# sourceMappingURL=fileDiscoveryService.js.map
