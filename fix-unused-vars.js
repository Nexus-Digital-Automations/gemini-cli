#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable no-undef */

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Script to automatically fix @typescript-eslint/no-unused-vars errors
 * by adding underscore prefixes to unused variables/parameters
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

// Get all files with no-unused-vars errors
function getFilesWithUnusedVars() {
  try {
    const output = execSync('npx eslint packages/cli/src --format=json', {
      encoding: 'utf8',
    });
    const results = JSON.parse(output);

    const filesWithUnusedVars = [];
    for (const result of results) {
      if (
        result.messages.some(
          (msg) => msg.ruleId === '@typescript-eslint/no-unused-vars',
        )
      ) {
        filesWithUnusedVars.push({
          filePath: result.filePath,
          messages: result.messages.filter(
            (msg) => msg.ruleId === '@typescript-eslint/no-unused-vars',
          ),
        });
      }
    }

    return filesWithUnusedVars;
  } catch (error) {
    console.error('Error getting ESLint results:', error.message);
    return [];
  }
}

// Fix unused variable by adding underscore prefix
function fixUnusedVar(content, line, column, varName) {
  const lines = content.split('\n');
  const targetLine = lines[line - 1];

  // Handle different patterns
  const patterns = [
    // Function parameters
    {
      regex: new RegExp(`\\b${varName}\\b(?=\\s*[,)])`, 'g'),
      replacement: `_${varName}`,
    },
    // Variable declarations
    {
      regex: new RegExp(`\\b${varName}\\b(?=\\s*=)`, 'g'),
      replacement: `_${varName}`,
    },
    // Destructuring
    {
      regex: new RegExp(`\\b${varName}\\b(?=\\s*[,}])`, 'g'),
      replacement: `_${varName}`,
    },
    // Catch blocks
    {
      regex: new RegExp(`catch\\s*\\(\\s*${varName}\\s*\\)`, 'g'),
      replacement: `catch (_${varName})`,
    },
    // For loop variables
    {
      regex: new RegExp(
        `\\bfor\\s*\\(\\s*const\\s+\\[([^,]*,\\s*)*${varName}(\\s*,.*)?\\]`,
        'g',
      ),
      replacement: (match) => match.replace(varName, `_${varName}`),
    },
  ];

  let modified = false;
  for (const pattern of patterns) {
    const newLine = targetLine.replace(pattern.regex, pattern.replacement);
    if (newLine !== targetLine) {
      lines[line - 1] = newLine;
      modified = true;
      break;
    }
  }

  return { content: lines.join('\n'), modified };
}

// Main function
function main() {
  const filesWithErrors = getFilesWithUnusedVars();

  if (filesWithErrors.length === 0) {
    console.log('No files with @typescript-eslint/no-unused-vars errors found');
    return;
  }

  let totalFixed = 0;

  for (const fileInfo of filesWithErrors) {
    const filePath = fileInfo.filePath;
    console.log(`Processing ${filePath}...`);

    let content = readFileSync(filePath, 'utf8');
    let fileModified = false;

    // Sort messages by line number in reverse order to avoid line number shifts
    const sortedMessages = fileInfo.messages.sort((a, b) => b.line - a.line);

    for (const message of sortedMessages) {
      // Extract variable name from message
      const match = message.message.match(
        /'([^']+)' is (?:defined but never used|assigned a value but never used)/,
      );
      if (match) {
        const varName = match[1];
        const result = fixUnusedVar(
          content,
          message.line,
          message.column,
          varName,
        );

        if (result.modified) {
          content = result.content;
          fileModified = true;
          totalFixed++;
          console.log(
            `  Fixed unused var '${varName}' at line ${message.line}`,
          );
        }
      }
    }

    if (fileModified) {
      writeFileSync(filePath, content);
      console.log(`  Updated ${filePath}`);
    }
  }

  console.log(`\nTotal unused variables fixed: ${totalFixed}`);
}

main();
